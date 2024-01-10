import {Service, PlatformAccessory} from 'homebridge';
import {FuturehomePlatform} from '../platform';
import axios from 'axios';
import {X_FH_APP_ID} from '../settings';

export class SmarthubAccessory {
  private readonly wifiSatelliteService: Service;

  constructor(
    private readonly platform: FuturehomePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly displayName: string,
    private readonly id: string,
    private readonly online: boolean,
  ) {
    const manufacturer = 'homebridge-futurehome';
    const firmwareRevision = process.env.npm_package_version ?? '1.0';

    // Set basic accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .updateCharacteristic(this.platform.Characteristic.Manufacturer, manufacturer)
      .updateCharacteristic(this.platform.Characteristic.Model, 'Smarthub')
      .updateCharacteristic(this.platform.Characteristic.SerialNumber, this.id)
      .updateCharacteristic(this.platform.Characteristic.FirmwareRevision, firmwareRevision);

    this.wifiSatelliteService =
      this.accessory.getService(this.platform.Service.WiFiSatellite) ||
      this.accessory.addService(this.platform.Service.WiFiSatellite);
    this.wifiSatelliteService.updateCharacteristic(this.platform.Characteristic.Name, this.displayName);

    this.wifiSatelliteService.updateCharacteristic(
      this.platform.Characteristic.WiFiSatelliteStatus,
      this.online ?
        this.platform.Characteristic.WiFiSatelliteStatus.CONNECTED :
        this.platform.Characteristic.WiFiSatelliteStatus.NOT_CONNECTED,
    );

    setInterval(
      async () => {
        try {
          const gatewayStatus = await axios.post(`https://${this.platform.niflheimHost}/`,
            {
              query: `
{
  site(id: "${this.platform.householdId!}") {
    gateways {
      id
      online
    }
  }
}

    `,
            }, {
              headers: {
                'x-fh-app-id': X_FH_APP_ID,
                'authorization': `Bearer ${this.platform.householdTokenHash!}`,
              },
            },
          );
          this.platform.log.debug('Gateway status response:', JSON.stringify(gatewayStatus.data));

          const online = gatewayStatus.data.data.site?.gateways[0]?.online;

          if (online === null || online === undefined) {
            this.wifiSatelliteService.updateCharacteristic(
              this.platform.Characteristic.WiFiSatelliteStatus,
              this.platform.Characteristic.WiFiSatelliteStatus.UNKNOWN,
            );
          } else if (online) {
            this.wifiSatelliteService.updateCharacteristic(
              this.platform.Characteristic.WiFiSatelliteStatus,
              this.platform.Characteristic.WiFiSatelliteStatus.CONNECTED,
            );
          } else {
            this.wifiSatelliteService.updateCharacteristic(
              this.platform.Characteristic.WiFiSatelliteStatus,
              this.platform.Characteristic.WiFiSatelliteStatus.NOT_CONNECTED,
            );
          }
        } catch (e) {
          this.platform.log.warn('Failed refreshing gateway status.', e);

          this.wifiSatelliteService.updateCharacteristic(
            this.platform.Characteristic.WiFiSatelliteStatus,
            this.platform.Characteristic.WiFiSatelliteStatus.UNKNOWN,
          );
        }
      },
      5000,
    );
  }
}
