import axios from 'axios';
import {API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic} from 'homebridge';
import mqtt, {MqttClient} from 'mqtt';
import {URLSearchParams} from 'url';
import {v4 as uuidv4} from 'uuid';
import * as zlib from 'zlib';

import {
  BETA_BIFROST_HOST,
  BETA_CLIENT_ID,
  BETA_CLIENT_SECRET,
  BETA_HEIMDALL_HOST,
  BETA_NIFLHEIM_HOST,
  PLATFORM_NAME,
  PLUGIN_NAME,
  PROD_BIFROST_HOST,
  PROD_CLIENT_ID,
  PROD_CLIENT_SECRET,
  PROD_HEIMDALL_HOST,
  PROD_NIFLHEIM_HOST,
  X_FH_APP_ID,
} from './settings';
import {FuturehomeAccessory} from './futurehomeAccessory';

export class FuturehomePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public readonly futurehomeAccessories: { [key: string]: FuturehomeAccessory } = {};

  public email?: string;
  public password?: string;
  public householdId?: string;
  public clientId?: string;
  public clientSecret?: string;
  public heimdallHost?: string;
  public niflheimHost?: string;
  public bifrostHost?: string;

  public deviceId?: string;
  public fhAccessTokenHash?: string;
  public fhRefreshToken?: string;
  public householdTokenHash?: string;
  public mqtt?: MqttClient;

  // This is used to be 100% sure the mqtt clients that failed to initialize are shut down.
  public mqttClientToShutDown?: MqttClient;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.deviceId = uuidv4();
    this.log.debug('Finished initializing platform:', this.config.name);

    if (!config || !config.options) {
      this.log.info('No options found in configuration file. Shutting down the plugin.');
      return;
    }
    const options = config.options;

    if (!options.email) {
      this.log.error('No email found in config. Shutting down the plugin.');
      return;
    }
    if (!options.password) {
      this.log.error('No password found in config. Shutting down the plugin.');
      return;
    }

    this.email = options.email;
    this.password = options.password;
    this.householdId = options.householdId;

    if (options.useBetaEnvironment) {
      this.clientId = BETA_CLIENT_ID;
      this.clientSecret = BETA_CLIENT_SECRET;
      this.heimdallHost = BETA_HEIMDALL_HOST;
      this.niflheimHost = BETA_NIFLHEIM_HOST;
      this.bifrostHost = BETA_BIFROST_HOST;
    } else {
      this.clientId = PROD_CLIENT_ID;
      this.clientSecret = PROD_CLIENT_SECRET;
      this.heimdallHost = PROD_HEIMDALL_HOST;
      this.niflheimHost = PROD_NIFLHEIM_HOST;
      this.bifrostHost = PROD_BIFROST_HOST;
    }

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already.
    this.api.on('didFinishLaunching', async () => {
      log.debug('Executed didFinishLaunching callback');
      // Run the method to discover / register your devices as accessories
      await this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info(`Loading accessory from cache: ${accessory.displayName} (id: ${accessory.context.device.id})`);

    // Add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  async discoverDevices() {
    try {
      const authResponse = await axios.post(`https://${this.heimdallHost}/auth/token`,
        new URLSearchParams({
          username: this.email!,
          password: this.password!,
          grant_type: 'password',
          client_id: this.clientId!,
          client_secret: this.clientSecret!,
        }),
        {
          headers: {
            'x-fh-app-id': X_FH_APP_ID,
          },
        },
      );
      this.fhAccessTokenHash = authResponse.data.access_token_hash;
      this.fhRefreshToken = authResponse.data.refresh_token;
    } catch (e) {
      this.log.error('Failed to authenticate with Futurehome servers! Shutting down the plugin.', e);
      return;
    }

    setInterval(
      async () => {
        try {
          const authRefreshResponse = await axios.post(`https://${this.heimdallHost}/auth/token`,
            new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: this.fhRefreshToken!,
              scope: 'heimdall',
              client_id: this.clientId!,
              client_secret: this.clientSecret!,
            }),
            {
              headers: {
                'x-fh-app-id': X_FH_APP_ID,
              },
            },
          );
          this.fhAccessTokenHash = authRefreshResponse.data.access_token_hash;
          this.fhRefreshToken = authRefreshResponse.data.refresh_token;
          this.log.debug('Refreshed auth tokens.');
        } catch (e) {
          this.log.warn('Failed refreshing auth tokens (next refresh in 4 hours).', e);

        }
      },
      // every 4 hours, because why not
      14400000,
    );

    if (!this.householdId) {
      try {
        const householdsResponse = await axios.post(`https://${this.niflheimHost}`,
          {
            query: `
{
  sites {
    name
    id
    address {
      buildingType
      address
      city
      postalCode
      country
    }
  }
}
    `,
          }, {
            headers: {
              'x-fh-app-id': X_FH_APP_ID,
              'authorization': `Bearer ${this.fhAccessTokenHash!}`,
            },
          },
        );

        const sites = householdsResponse.data?.data?.sites;
        if (sites == null || sites?.length === 0) {
          this.log.error('Could not find any households in user account! Shutting down the plugin.');
          return;
        }

        this.householdId = sites[0].id;
      } catch (e) {
        this.log.error('Failed fetching user households! Shutting down the plugin.', e);
        return;
      }
    }

    this.log.info(`Using the household with id "${this.householdId!}"`);

    try {
      await this.refreshHouseholdTokens();
      this.log.info('Got household tokens.');
    } catch (e) {
      this.log.error('Failed fetching household auth tokens! Shutting down the plugin.', e);
      return;
    }

    try {
      const householdsDevicesResponse = await axios.post(`https://${this.niflheimHost}/`,
        {
          query: `
{
  site(id: "${this.householdId!}") {
    devices {
      id
      address
      name
      model
      modelAlias
      type
      services {
        name
        address
        enabled
        props
        interfaces
        metadata
      }
      metadata
    }
  }
}

    `,
        }, {
          headers: {
            'x-fh-app-id': X_FH_APP_ID,
            'authorization': `Bearer ${this.householdTokenHash!}`,
          },
        },
      );

      this.log.debug('Got devices info:', JSON.stringify(householdsDevicesResponse.data.data.site.devices));

      let devices = householdsDevicesResponse.data.data.site.devices;

      // Filter out devices with no services
      devices = devices.filter(e => e.services != null && e.services.length != 0);

      if (devices.length > 149) {
        this.log.warn(`WARNING: CANNOT ADD MORE THAN 149 DEVICES! (found ${devices.length} in household)`);
        devices = devices.slice(0, 149);
      }

      // Remove accessories not present in the current devices list
      const currentDeviceUUIDs = new Set();
      for (const device of devices) {
        const uuid = this.api.hap.uuid.generate(`${device.id}@${this.householdId!}`);
        currentDeviceUUIDs.add(uuid);
      }
      for (const accessory of this.accessories) {
        if (!currentDeviceUUIDs.has(accessory.UUID)) {
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          this.log.info(`Removing accessory not found in site devices: ${accessory.displayName} (id: ${accessory.context.device.id})`);
        }
      }

      for (const device of devices) {
        const uuid = this.api.hap.uuid.generate(`${device.id}@${this.householdId!}`);

        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (existingAccessory) {
          this.log.info(`Restoring existing accessory from cache: ${existingAccessory.displayName} (id: ${existingAccessory.context.device.id})`);

          existingAccessory.context.device = device;
          this.api.updatePlatformAccessories([existingAccessory]);

          this.futurehomeAccessories[device.id.toString()] = new FuturehomeAccessory(this, existingAccessory);
        } else {
          this.log.info(`Adding new accessory: ${device.name} (id: ${device.id})`);

          const accessory = new this.api.platformAccessory(device.name, uuid);

          accessory.context.device = device;

          this.futurehomeAccessories[device.id.toString()] = new FuturehomeAccessory(this, accessory);

          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
      }
    } catch (e) {
      this.log.error('Failed fetching or setting up the devices! Shutting down the plugin.', e);
      return;
    }

    const periodicalResync = async () => {
      if (this.mqttClientToShutDown != null) {
        this.log.debug('Shutting down the old MQTT client that failed to initialize.');
        try {
          await this.mqttClientToShutDown?.endAsync(true);
          this.log.debug('The old MQTT client that failed to initialize has been shut down.');
        } catch (e) {
          this.log.error('FAILED TO SHUT DOWN THE OLD MQTT CLIENT THAT FAILED TO INITIALIZE. THIS WILL CAUSE MEMORY LEAKS. RESTART THE PLUGIN IF POSSIBLE.', e);
        }
      }

      await this.refreshHouseholdTokens();
      this.log.debug('Refreshed household tokens.');

      const newMqttClient = mqtt.connect(
        `wss://${this.bifrostHost}/proxy?token_hash=${encodeURIComponent(this.householdTokenHash!)}`,
        {
          clientId: this.householdTokenHash!,
          protocolId: 'MQIsdp',
          protocolVersion: 3,
          port: 443,
        },
      );
      this.mqttClientToShutDown = newMqttClient;

      newMqttClient!.on('connect', () => {
        this.log.debug('Connected to FIMP API');

        newMqttClient.subscribe(
          [
            `${this.householdId!}_${this.householdTokenHash!}/#`,
            `${this.householdId!}/+/+/+/rn:cloud_adapter/#`,
            `${this.householdId!}/pt:j1/mt:rsp/rt:cloud/rn:remote-client/ad:smarthome-app`,
          ],
          {
            qos: 1,
          },
          async (error) => {
            if (error) {
              this.log.error('Subscribing to FIMP API MQTT topics failed:', error);
              throw error;
            }

            await this.startFimpSession(newMqttClient);

            this.log.debug('Started a new FIMP session.');

            await this.fetchDevicesState(newMqttClient);

            this.log.debug('Successfully initialized FIMP session and devices state');

            this.mqttClientToShutDown = undefined;
            const oldMqttClient = this.mqtt;
            this.mqtt = newMqttClient;
            if (oldMqttClient != null) {
              this.log.debug('Switched MQTT clients, new requests will use the updated one');
              // Waiting 15s to allow all currently executing FIMP requests to finish
              await new Promise(resolve => setTimeout(resolve, 15000));

              this.log.debug('Shutting down the old MQTT client...');
              try {
                await oldMqttClient?.endAsync(true);
                this.log.debug('The old MQTT client has been shut down.');
              } catch (e) {
                this.log.error('Failed trying to shut down the old MQTT client.', e);
              }
            } else {
              this.log.info('Started FIMP session and initialized all state');
            }
          },
        );
      });

      newMqttClient!.on('message', (topic, messageBuffer) => {
        zlib.gunzip(messageBuffer, (err, buffer) => {
          if (err) {
            this.log.debug(`Failed decoding MQTT message (buffer length: ${messageBuffer.length}). This is probably not a bug.`, err);
            return;
          }

          const msgRaw = buffer.toString();

          this.log.debug(`Received MQTT message: ${msgRaw}`);

          const msg = JSON.parse(msgRaw);
          if (msg.type === 'evt.pd7.response') {
            const devices = msg.val?.param?.devices;
            if (devices) {
              this.log.debug('Got devices state update:', msgRaw);
              for (const device of devices) {
                this.futurehomeAccessories[device.id.toString()]?.updateDeviceState(device);
              }
            }
          }
        });
      });

      // To allow many async FIMP request being run in parallel
      newMqttClient?.setMaxListeners(0);
    };

    await periodicalResync();

    setInterval(
      async () => {
        try {
          await periodicalResync();
          this.log.debug('Started a new FIMP session and re-fetched all state');
        } catch (e) {
          this.log.error(
            'Failed refreshing FIMP session (you may not be able to control your devices for 5-10 minutes) (retrying in 5 minutes).',
            e,
          );
        }
      },
      300000,
    );
  }

  async refreshHouseholdTokens() {
    const householdTokensResponse = await axios.get(`https://${this.heimdallHost}/auth/exchange/${this.householdId!}`,
      {
        headers: {
          'x-fh-app-id': X_FH_APP_ID,
          'authorization': `Bearer ${this.fhAccessTokenHash!}`,
        },
      },
    );
    this.householdTokenHash = householdTokensResponse.data.site_token_hash;
  }

  async startFimpSession(mqttClient: MqttClient) {
    this.log.debug('Starting/refreshing FIMP session');
    await this.sendFimpMsg({
      address: '/rt:app/rn:clbridge/ad:1',
      service: 'clbridge',
      cmd: 'cmd.session.start',
      val: {
        'token': this.householdTokenHash!,
        'client-id': this.householdTokenHash!,
        'username': this.email!,
        'device-id': this.deviceId!,
        'compression': 'gzip',
      },
      val_t: 'str_map',
      mqttClient: mqttClient,
      // For this request it could be anything idk
      matchAnyEvt: true,
    });
  }

  async fetchDevicesState(mqttClient: MqttClient) {
    this.log.debug('Triggering devices state fetch');
    await this.sendFimpMsg({
      address: '/rt:app/rn:vinculum/ad:1',
      service: 'vinculum',
      cmd: 'cmd.pd7.request',
      val: {
        cmd: 'get',
        component: 'state',
      },
      val_t: 'object',
      mqttClient: mqttClient,
      timeoutMs: 30000,
    });
  }

  async sendFimpMsg(parameters: {
    address: string;
    service: string;
    cmd: string;
    val: unknown;
    val_t: string;
    mqttClient?: MqttClient;
    timeoutMs?: number;
    matchAnyEvt?: boolean;
  }) {
    const effectiveMqttClient = parameters.mqttClient || this.mqtt!;

    const uid = uuidv4();
    const topic = `${this.householdId!}/pt:j1/mt:cmd${parameters.address}`;
    const message = JSON.stringify(
      {
        corid: null,
        ctime: new Date().toISOString(),
        props: {},
        resp_to: 'pt:j1/mt:rsp/rt:cloud/rn:remote-client/ad:smarthome-app',
        serv: parameters.service,
        src: 'smarthome-app',
        tags: [],
        'type': parameters.cmd,
        uid: uid,
        val: parameters.val,
        val_t: parameters.val_t,
        ver: '1',
      },
    );

    // For example for "cmd.foo.set" we would expect to get "evt.foo.report" back (plus the service name must match).
    let possibleResponseType: string | null = null;
    if (parameters.cmd.split('.').length === 3) {
      possibleResponseType = parameters.cmd.split('.').map(
        (part, index, array) => index === 0 ? 'evt' : (index === array.length - 1 ? 'report' : part),
      ).join('.');
    }

    const stackTrace = Error().stack;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        effectiveMqttClient.removeListener('message', onResponse);
        this.log.warn(`Timeout waiting for FIMP response (service: ${parameters.service}, cmd: ${parameters.cmd})`, stackTrace);
        reject(new this.api.hap.HapStatusError(this.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE));
      }, parameters.timeoutMs || 10000);

      const onResponse = (topic: string, messageBuffer: Buffer) => {
        zlib.gunzip(messageBuffer, (err, buffer) => {
          if (err) {
            return;
          }

          const msg = JSON.parse(buffer.toString());

          if (msg.corid === uid) {
            if (msg.type === 'evt.error.report') {
              this.log.warn(`Received FIMP response for message ${uid}: error (evt.error.report) (matched using uid)`);

              effectiveMqttClient.removeListener('message', onResponse);
              reject(new this.api.hap.HapStatusError(this.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE));
              return;
            }

            this.log.debug(`Received FIMP response for message ${uid} (matched using uid).`);

            clearTimeout(timeout);
            effectiveMqttClient.removeListener('message', onResponse);
            resolve(msg);
            return;
          }

          if (msg.topic === `pt:j1/mt:evt${parameters.address}`) {
            if (msg.type === 'evt.error.report') {
              this.log.warn(`Received FIMP response for message ${uid}: error (evt.error.report) (matched using topic)`);

              effectiveMqttClient.removeListener('message', onResponse);
              reject(new this.api.hap.HapStatusError(this.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE));
              return;
            }

            this.log.debug(`Received FIMP response for message ${uid} (matched using topic).`);

            clearTimeout(timeout);
            effectiveMqttClient.removeListener('message', onResponse);
            resolve(msg);
            return;
          }

          // TODO: is this needed?
          // if (possibleResponseType != null && msg.type === possibleResponseType && msg.serv === parameters.service) {
          //   this.log.debug(`Received FIMP response for message ${uid} (matched using possible response type "${possibleResponseType}").`);
          //
          //   clearTimeout(timeout);
          //   effectiveMqttClient.removeListener('message', onResponse);
          //   resolve(msg);
          //   return;
          // }

          if (parameters.matchAnyEvt && msg.type != null && msg.type.startsWith('evt.') && msg.serv === parameters.service) {
            this.log.debug(`Received FIMP response for message ${uid} (this request allowed for response to be matched using just "evt." type prefix + service name, matched for "${msg.type}").`);

            clearTimeout(timeout);
            effectiveMqttClient.removeListener('message', onResponse);
            resolve(msg);
            return;
          }
        });
      };

      effectiveMqttClient.on('message', onResponse);

      this.log.debug(`
Sending FIMP message:
address: "${parameters.address}",
service: "${parameters.service}",
uid: "${uid}",
cmd: "${parameters.cmd}",
val: "${JSON.stringify(parameters.val)}",
val_t: "${parameters.val_t}"
`);

      effectiveMqttClient.publish(topic, message, {qos: 1});
    });
  }
}
