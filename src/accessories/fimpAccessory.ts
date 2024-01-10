import {Service, PlatformAccessory, CharacteristicValue} from 'homebridge';
import {v4 as uuidv4} from 'uuid';

import {FuturehomePlatform} from '../platform';
import {HAPConnection} from 'hap-nodejs/dist/lib/util/eventedhttp';
import {Nullable} from 'hap-nodejs/dist/types';
import {CharacteristicContext} from 'hap-nodejs/dist/lib/Characteristic';

export class FimpAccessory {
  private readonly deviceName: string;
  private readonly deviceType: string;

  private batteryService?: Service;
  private contactSensorService?: Service;
  private doorService?: Service;
  private humiditySensorService?: Service;
  private lightSensorService?: Service;
  private lightbulbService?: Service;
  private lockMechanismService?: Service;
  private occupancySensorService?: Service;
  private smartSpeakerService?: Service;
  private smokeSensorService?: Service;
  private switchService?: Service;
  private temperatureSensorService?: Service;
  private thermostatService?: Service;
  private windowCoveringService?: Service;

  private readonly updateCharacteristicHandlers: {
    [key: string]: ((serviceState) => void)[]
  } = {};

  constructor(
    private readonly platform: FuturehomePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.deviceName = accessory.context.device.name ?? '';
    this.deviceType = accessory.context.device.type.type ?? '';
    const manufacturer = 'homebridge-futurehome';
    const effectiveModel = accessory.context.device.modelAlias ? accessory.context.device.modelAlias : accessory.context.device.model;
    const serialNumber = `id: ${accessory.context.device.id}, address: ${accessory.context.device.address}, type: ${this.deviceType}`;
    const firmwareRevision = process.env.npm_package_version ?? '1.0';

    // Set basic accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .updateCharacteristic(this.platform.Characteristic.Manufacturer, manufacturer)
      .updateCharacteristic(this.platform.Characteristic.Model, effectiveModel)
      .updateCharacteristic(this.platform.Characteristic.SerialNumber, serialNumber)
      .updateCharacteristic(this.platform.Characteristic.FirmwareRevision, firmwareRevision);

    // TODO: do something about device types?
    //   appliance
    //   battery
    //   blinds
    //   boiler
    //   chargepoint
    //   door_lock
    //   fan
    //   fire_detector
    //   garage_door
    //   gas_detector
    //   gate
    //   heat_detector
    //   heat_pump
    //   heater
    //   input
    //   leak_detector
    //   light
    //   media_player
    //   meter
    //   power_regulator
    //   sensor
    //   siren
    //   thermostat
    //   water_valve

    const alarm_appliance = accessory.context.device.services.find(e => e.name === 'alarm_appliance');
    const alarm_burglar = accessory.context.device.services.find(e => e.name === 'alarm_burglar');
    const alarm_emergency = accessory.context.device.services.find(e => e.name === 'alarm_emergency');
    const alarm_fire = accessory.context.device.services.find(e => e.name === 'alarm_fire');
    const alarm_gas = accessory.context.device.services.find(e => e.name === 'alarm_gas');
    const alarm_health = accessory.context.device.services.find(e => e.name === 'alarm_health');
    const alarm_heat = accessory.context.device.services.find(e => e.name === 'alarm_heat');
    const alarm_lock = accessory.context.device.services.find(e => e.name === 'alarm_lock');
    const alarm_power = accessory.context.device.services.find(e => e.name === 'alarm_power');
    const alarm_siren = accessory.context.device.services.find(e => e.name === 'alarm_siren');
    const alarm_system = accessory.context.device.services.find(e => e.name === 'alarm_system');
    const alarm_time = accessory.context.device.services.find(e => e.name === 'alarm_time');
    const alarm_water = accessory.context.device.services.find(e => e.name === 'alarm_water');
    const alarm_water_valve = accessory.context.device.services.find(e => e.name === 'alarm_water_valve');
    const alarm_weather = accessory.context.device.services.find(e => e.name === 'alarm_weather');
    const barrier_ctrl = accessory.context.device.services.find(e => e.name === 'barrier_ctrl');
    const basic = accessory.context.device.services.find(e => e.name === 'basic');
    const battery = accessory.context.device.services.find(e => e.name === 'battery');
    const chargepoint = accessory.context.device.services.find(e => e.name === 'chargepoint');
    const color_ctrl = accessory.context.device.services.find(e => e.name === 'color_ctrl');
    const complex_alarm_system = accessory.context.device.services.find(e => e.name === 'complex_alarm_system');
    const dev_sys = accessory.context.device.services.find(e => e.name === 'dev_sys');
    const door_lock = accessory.context.device.services.find(e => e.name === 'door_lock');
    const doorman = accessory.context.device.services.find(e => e.name === 'doorman');
    const fan_ctrl = accessory.context.device.services.find(e => e.name === 'fan_ctrl');
    const gateway = accessory.context.device.services.find(e => e.name === 'gateway');
    const media_player = accessory.context.device.services.find(e => e.name === 'media_player');
    const meter_elec = accessory.context.device.services.find(e => e.name === 'meter_elec');
    const meter_gas = accessory.context.device.services.find(e => e.name === 'meter_gas');
    const meter_water = accessory.context.device.services.find(e => e.name === 'meter_water');
    const ota = accessory.context.device.services.find(e => e.name === 'ota');
    const out_bin_switch = accessory.context.device.services.find(e => e.name === 'out_bin_switch');
    const out_lvl_switch = accessory.context.device.services.find(e => e.name === 'out_lvl_switch');
    const parameters = accessory.context.device.services.find(e => e.name === 'parameters');
    const power_regulator = accessory.context.device.services.find(e => e.name === 'power_regulator');
    const scene_ctrl = accessory.context.device.services.find(e => e.name === 'scene_ctrl');
    const sensor_accelx = accessory.context.device.services.find(e => e.name === 'sensor_accelx');
    const sensor_accely = accessory.context.device.services.find(e => e.name === 'sensor_accely');
    const sensor_accelz = accessory.context.device.services.find(e => e.name === 'sensor_accelz');
    const sensor_airflow = accessory.context.device.services.find(e => e.name === 'sensor_airflow');
    const sensor_anglepos = accessory.context.device.services.find(e => e.name === 'sensor_anglepos');
    const sensor_atmo = accessory.context.device.services.find(e => e.name === 'sensor_atmo');
    const sensor_baro = accessory.context.device.services.find(e => e.name === 'sensor_baro');
    const sensor_co = accessory.context.device.services.find(e => e.name === 'sensor_co');
    const sensor_co2 = accessory.context.device.services.find(e => e.name === 'sensor_co2');
    const sensor_contact = accessory.context.device.services.find(e => e.name === 'sensor_contact');
    const sensor_current = accessory.context.device.services.find(e => e.name === 'sensor_current');
    const sensor_dew = accessory.context.device.services.find(e => e.name === 'sensor_dew');
    const sensor_direct = accessory.context.device.services.find(e => e.name === 'sensor_direct');
    const sensor_distance = accessory.context.device.services.find(e => e.name === 'sensor_distance');
    const sensor_elresist = accessory.context.device.services.find(e => e.name === 'sensor_elresist');
    const sensor_freq = accessory.context.device.services.find(e => e.name === 'sensor_freq');
    const sensor_gp = accessory.context.device.services.find(e => e.name === 'sensor_gp');
    const sensor_gust = accessory.context.device.services.find(e => e.name === 'sensor_gust');
    const sensor_humid = accessory.context.device.services.find(e => e.name === 'sensor_humid');
    const sensor_lumin = accessory.context.device.services.find(e => e.name === 'sensor_lumin');
    const sensor_moist = accessory.context.device.services.find(e => e.name === 'sensor_moist');
    const sensor_noise = accessory.context.device.services.find(e => e.name === 'sensor_noise');
    const sensor_power = accessory.context.device.services.find(e => e.name === 'sensor_power');
    const sensor_presence = accessory.context.device.services.find(e => e.name === 'sensor_presence');
    const sensor_rain = accessory.context.device.services.find(e => e.name === 'sensor_rain');
    const sensor_rotation = accessory.context.device.services.find(e => e.name === 'sensor_rotation');
    const sensor_seismicint = accessory.context.device.services.find(e => e.name === 'sensor_seismicint');
    const sensor_seismicmag = accessory.context.device.services.find(e => e.name === 'sensor_seismicmag');
    const sensor_solarrad = accessory.context.device.services.find(e => e.name === 'sensor_solarrad');
    const sensor_tank = accessory.context.device.services.find(e => e.name === 'sensor_tank');
    const sensor_temp = accessory.context.device.services.find(e => e.name === 'sensor_temp');
    const sensor_tidelvl = accessory.context.device.services.find(e => e.name === 'sensor_tidelvl');
    const sensor_uv = accessory.context.device.services.find(e => e.name === 'sensor_uv');
    const sensor_veloc = accessory.context.device.services.find(e => e.name === 'sensor_veloc');
    const sensor_voltage = accessory.context.device.services.find(e => e.name === 'sensor_voltage');
    const sensor_watflow = accessory.context.device.services.find(e => e.name === 'sensor_watflow');
    const sensor_watpressure = accessory.context.device.services.find(e => e.name === 'sensor_watpressure');
    const sensor_wattemp = accessory.context.device.services.find(e => e.name === 'sensor_wattemp');
    const sensor_weight = accessory.context.device.services.find(e => e.name === 'sensor_weight');
    const sensor_wind = accessory.context.device.services.find(e => e.name === 'sensor_wind');
    const siren_ctrl = accessory.context.device.services.find(e => e.name === 'siren_ctrl');
    const thermostat = accessory.context.device.services.find(e => e.name === 'thermostat');
    const user_code = accessory.context.device.services.find(e => e.name === 'user_code');
    const virtual_meter_elec = accessory.context.device.services.find(e => e.name === 'virtual_meter_elec');
    const water_heater = accessory.context.device.services.find(e => e.name === 'water_heater');

    this.batteryService = this.accessory.getService(this.platform.Service.Battery);
    if (!this.buildBatteryService(battery) && this.batteryService) {
      this.accessory.removeService(this.batteryService);
      this.batteryService = undefined;
    }

    this.contactSensorService = this.accessory.getService(this.platform.Service.ContactSensor);
    if (!this.buildContactSensorService(sensor_contact) && this.contactSensorService) {
      this.accessory.removeService(this.contactSensorService);
      this.contactSensorService = undefined;
    }

    this.doorService = this.accessory.getService(this.platform.Service.Door);
    if (!this.buildDoorService(door_lock) && this.doorService) {
      this.accessory.removeService(this.doorService);
      this.doorService = undefined;
    }

    this.humiditySensorService = this.accessory.getService(this.platform.Service.HumiditySensor);
    if (!this.buildHumiditySensorService(sensor_humid) && this.humiditySensorService) {
      this.accessory.removeService(this.humiditySensorService);
      this.humiditySensorService = undefined;
    }

    this.lightSensorService = this.accessory.getService(this.platform.Service.LightSensor);
    if (!this.buildLightSensorService(sensor_lumin) && this.lightSensorService) {
      this.accessory.removeService(this.lightSensorService);
      this.lightSensorService = undefined;
    }

    this.lightbulbService = this.accessory.getService(this.platform.Service.Lightbulb);
    if (!this.buildLightbulbService(out_lvl_switch, out_bin_switch, color_ctrl) && this.lightbulbService) {
      this.accessory.removeService(this.lightbulbService);
      this.lightbulbService = undefined;
    }

    this.lockMechanismService = this.accessory.getService(this.platform.Service.LockMechanism);
    if (!this.buildLockMechanism(door_lock) && this.lockMechanismService) {
      this.accessory.removeService(this.lockMechanismService);
      this.lockMechanismService = undefined;
    }

    this.occupancySensorService = this.accessory.getService(this.platform.Service.OccupancySensor);
    if (!this.buildOccupancySensorService(sensor_presence) && this.occupancySensorService) {
      this.accessory.removeService(this.occupancySensorService);
      this.occupancySensorService = undefined;
    }

    this.smartSpeakerService = this.accessory.getService(this.platform.Service.SmartSpeaker);
    if (!this.buildSmartSpeakerService(media_player) && this.smartSpeakerService) {
      this.accessory.removeService(this.smartSpeakerService);
      this.smartSpeakerService = undefined;
    }

    this.smokeSensorService = this.accessory.getService(this.platform.Service.SmokeSensor);
    if (!this.buildSmokeSensorService(alarm_fire) && this.smokeSensorService) {
      this.accessory.removeService(this.smokeSensorService);
      this.smokeSensorService = undefined;
    }

    this.switchService = this.accessory.getService(this.platform.Service.Switch);
    if (!this.buildSwitchService(out_bin_switch) && this.switchService) {
      this.accessory.removeService(this.switchService);
      this.switchService = undefined;
    }

    this.temperatureSensorService = this.accessory.getService(this.platform.Service.TemperatureSensor);
    if (!this.buildTemperatureSensorService(sensor_temp, sensor_wattemp) && this.temperatureSensorService) {
      this.accessory.removeService(this.temperatureSensorService);
      this.temperatureSensorService = undefined;
    }

    this.thermostatService = this.accessory.getService(this.platform.Service.Thermostat);
    if (!this.buildThermostatService(thermostat, sensor_temp) && this.thermostatService) {
      this.accessory.removeService(this.thermostatService);
      this.thermostatService = undefined;
    }

    this.windowCoveringService = this.accessory.getService(this.platform.Service.WindowCovering);
    if (!this.buildWindowCoveringService(out_lvl_switch, out_bin_switch) && this.windowCoveringService) {
      this.accessory.removeService(this.windowCoveringService);
      this.windowCoveringService = undefined;
    }
  }

  buildBatteryService(battery) {
    if (!battery) {
      return false;
    }
    this.batteryService = this.batteryService || this.accessory.addService(this.platform.Service.Battery);
    this.batteryService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    this.addUpdateCharacteristicHandler(battery.name, (serviceState) => {
      const batteryLvl = this.findLatestAttr(serviceState, 'lvl')?.val;
      if (batteryLvl != null) {
        this.batteryService!.updateCharacteristic(
          this.platform.Characteristic.StatusLowBattery,
          batteryLvl > 20 ?
            this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL :
            this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW,
        );
        this.batteryService!.updateCharacteristic(
          this.platform.Characteristic.BatteryLevel,
          batteryLvl,
        );
      }
    });
    return true;
  }

  buildContactSensorService(sensor_contact) {
    if (!sensor_contact) {
      return false;
    }
    this.contactSensorService = this.contactSensorService || this.accessory.addService(this.platform.Service.ContactSensor);
    this.contactSensorService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    this.addUpdateCharacteristicHandler(sensor_contact.name, (serviceState) => {
      const open = this.findLatestAttr(serviceState, 'open')?.val;
      if (open != null) {
        this.contactSensorService!.updateCharacteristic(
          this.platform.Characteristic.ContactSensorState,
          open ?
            this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED :
            this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED,
        );
      }
    });
    return true;
  }

  buildDoorService(door_lock): boolean {
    if (!door_lock) {
      return false;
    }
    this.doorService = this.doorService || this.accessory.addService(this.platform.Service.Door);
    this.doorService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    this.addUpdateCharacteristicHandler(door_lock.name, (serviceState) => {
      const door_is_closed = this.findLatestAttr(serviceState, 'lock')?.val?.door_is_closed;
      if (door_is_closed != null) {
        this.doorService!.updateCharacteristic(
          this.platform.Characteristic.CurrentPosition,
          door_is_closed ? 0 : 100,
        );
        this.doorService!.updateCharacteristic(
          this.platform.Characteristic.TargetPosition,
          door_is_closed ? 0 : 100,
        );
      }
    });

    return true;
  }

  buildHumiditySensorService(sensor_humid) {
    if (!sensor_humid) {
      return false;
    }
    this.humiditySensorService = this.humiditySensorService || this.accessory.addService(this.platform.Service.HumiditySensor);
    this.humiditySensorService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    this.addUpdateCharacteristicHandler(sensor_humid.name, (serviceState) => {
      const humidity = this.findLatestAttr(serviceState, 'sensor')?.val;
      if (humidity != null) {
        this.humiditySensorService!.updateCharacteristic(
          this.platform.Characteristic.CurrentRelativeHumidity,
          humidity,
        );
      }
    });
    return true;
  }

  buildLightSensorService(sensor_lumin) {
    if (!sensor_lumin) {
      return false;
    }
    this.lightSensorService = this.lightSensorService || this.accessory.addService(this.platform.Service.LightSensor);
    this.lightSensorService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    this.addUpdateCharacteristicHandler(sensor_lumin.name, (serviceState) => {
      const lux = this.findLatestAttr(serviceState, 'sensor')?.val;
      if (lux != null) {
        this.lightSensorService!.updateCharacteristic(
          this.platform.Characteristic.CurrentAmbientLightLevel,
          lux,
        );
      }
    });
    return true;
  }

  buildLightbulbService(out_lvl_switch, out_bin_switch, color_ctrl): boolean {
    if (out_lvl_switch == null && out_bin_switch == null) {
      return false;
    }
    if (this.deviceType !== 'light') {
      return false;
    }
    this.lightbulbService = this.lightbulbService || this.accessory.addService(this.platform.Service.Lightbulb);
    this.lightbulbService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    const out_bin_switch_cmd_binary_set = out_bin_switch?.interfaces?.find(e => e === 'cmd.binary.set');
    if (out_bin_switch_cmd_binary_set) {
      this.addUpdateCharacteristicHandler(out_bin_switch.name, (serviceState) => {
        const binaryValue = this.findLatestAttr(serviceState, 'binary')?.val
        if (binaryValue != null) {
          this.lightbulbService!.updateCharacteristic(
            this.platform.Characteristic.On,
            binaryValue,
          );
        }
      });
      this.lightbulbService!.getCharacteristic(this.platform.Characteristic.On).onSet(async (value: CharacteristicValue) => {
        await this.platform.sendFimpMsg({
          address: out_bin_switch.address,
          service: out_bin_switch.name,
          cmd: 'cmd.binary.set',
          val: value as boolean,
          val_t: 'bool',
        });
      });
    }

    if (out_lvl_switch) {
      const cmd_binary_set = out_lvl_switch.interfaces?.find(e => e === 'cmd.binary.set');
      const cmd_lvl_set = out_lvl_switch.interfaces?.find(e => e === 'cmd.lvl.set');
      const minValue = out_lvl_switch.props.min_lvl;
      const maxValue = out_lvl_switch.props.max_lvl;
      if (cmd_binary_set && cmd_lvl_set && minValue != null && maxValue != null) {

        this.addUpdateCharacteristicHandler(out_lvl_switch.name, (serviceState) => {
          const binaryValue = this.findLatestAttr(serviceState, 'binary')?.val
          const lvlValue = this.findLatestAttr(serviceState, 'lvl')?.val

          if (!out_bin_switch_cmd_binary_set) {
            if (binaryValue != null) {
              this.lightbulbService!.updateCharacteristic(
                this.platform.Characteristic.On,
                binaryValue,
              );
            } else if (lvlValue != null) {
              this.lightbulbService!.updateCharacteristic(
                this.platform.Characteristic.On,
                lvlValue != minValue,
              );
            }
          }

          if (lvlValue != null) {
            this.lightbulbService!.updateCharacteristic(
              this.platform.Characteristic.Brightness,
              this.mapValue(lvlValue, minValue, maxValue, 0, 100),
            );
          }
        });
        if (!out_bin_switch_cmd_binary_set) {
          this.lightbulbService.getCharacteristic(this.platform.Characteristic.On).onSet(async (value: CharacteristicValue) => {
            await this.platform.sendFimpMsg({
              address: out_lvl_switch.address,
              service: out_lvl_switch.name,
              cmd: 'cmd.binary.set',
              val: value as boolean,
              val_t: 'bool',
            });
          });
        }
        this.lightbulbService.getCharacteristic(this.platform.Characteristic.Brightness).onSet(async (value: CharacteristicValue) => {
          await this.platform.sendFimpMsg({
            address: out_lvl_switch.address,
            service: out_lvl_switch.name,
            cmd: 'cmd.lvl.set',
            val: this.mapValue(value as number, 0, 100, minValue, maxValue),
            val_t: 'int',
          });
        });
      }
    }

    if (color_ctrl) {
      const warm_w = color_ctrl.props?.sup_components?.find(e => e === 'warm_w');
      const cold_w = color_ctrl.props?.sup_components?.find(e => e === 'cold_w');

      if (warm_w && cold_w) {
        this.addUpdateCharacteristicHandler(color_ctrl.name, (serviceState) => {
          const cold_wValue = this.findLatestAttr(serviceState, 'color')?.val?.cold_wValue;
          const warm_wValue = this.findLatestAttr(serviceState, 'color')?.val?.warm_wValue;
          if (cold_wValue != null && warm_wValue != null) {
            this.lightbulbService!.updateCharacteristic(
              this.platform.Characteristic.ColorTemperature,
              this.mapValue(255 + warm_wValue - cold_wValue, 0, 510, 140, 500),
            );
          }
        });
        this.lightbulbService!.getCharacteristic(this.platform.Characteristic.ColorTemperature).onSet(async (value: CharacteristicValue) => {
          const tempNewTemp = this.mapValue(value as number, 140, 500, 0, 510)

          let warm_w: number;
          let cold_w: number;

          if (tempNewTemp === 255) {
            warm_w = 0;
            cold_w = 0;
          } else if (tempNewTemp > 255) {
            warm_w = Math.round(tempNewTemp - 255);
            cold_w = 0;
          } else {
            warm_w = 0;
            cold_w = Math.round(255 - tempNewTemp);
          }


          await this.platform.sendFimpMsg({
            address: color_ctrl.address,
            service: color_ctrl.name,
            cmd: 'cmd.color.set',
            val: {
              warm_w: warm_w,
              cold_w: cold_w,
            },
            val_t: 'int_map',
          });
        });
      }
    }
    return true;
  }

  buildLockMechanism(door_lock): boolean {
    if (!door_lock) {
      return false;
    }
    this.lockMechanismService = this.lockMechanismService || this.accessory.addService(this.platform.Service.LockMechanism);
    this.lockMechanismService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    this.addUpdateCharacteristicHandler(door_lock.name, (serviceState) => {
      const is_secured = this.findLatestAttr(serviceState, 'lock')?.val?.is_secured;
      if (is_secured != null) {
        this.lockMechanismService!.updateCharacteristic(
          this.platform.Characteristic.LockCurrentState,
          is_secured ? this.platform.Characteristic.LockCurrentState.SECURED : this.platform.Characteristic.LockCurrentState.UNSECURED,
        );
        this.lockMechanismService!.updateCharacteristic(
          this.platform.Characteristic.LockTargetState,
          is_secured ? this.platform.Characteristic.LockTargetState.SECURED : this.platform.Characteristic.LockTargetState.UNSECURED,
        );
      }
    });

    return true;
  }

  buildOccupancySensorService(sensor_presence) {
    if (!sensor_presence) {
      return false;
    }
    this.occupancySensorService = this.occupancySensorService || this.accessory.addService(this.platform.Service.OccupancySensor);
    this.occupancySensorService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    this.addUpdateCharacteristicHandler(sensor_presence.name, (serviceState) => {
      const presence = this.findLatestAttr(serviceState, 'presence')?.val;
      if (presence != null) {
        this.occupancySensorService!.updateCharacteristic(
          this.platform.Characteristic.OccupancyDetected,
          presence ?
            this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED :
            this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED,
        );
      }
    });
    return true;
  }

  buildSmartSpeakerService(media_player): boolean {
    if (!media_player) {
      return false;
    }
    this.smartSpeakerService = this.smartSpeakerService || this.accessory.addService(this.platform.Service.SmartSpeaker);
    this.smartSpeakerService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    this.addUpdateCharacteristicHandler(media_player.name, (serviceState) => {
      const playbackValue = this.findLatestAttr(serviceState, 'playback')?.val;
      if (playbackValue != null) {
        this.smartSpeakerService!.updateCharacteristic(
          this.platform.Characteristic.CurrentMediaState,
          playbackValue == 'pause' ?
            this.platform.Characteristic.CurrentMediaState.PAUSE :
            this.platform.Characteristic.CurrentMediaState.PLAY,
        );
        this.smartSpeakerService!.updateCharacteristic(
          this.platform.Characteristic.TargetMediaState,
          playbackValue == 'pause' ?
            this.platform.Characteristic.TargetMediaState.PAUSE :
            this.platform.Characteristic.TargetMediaState.PLAY,
        );
      }
    });
    this.addUpdateCharacteristicHandler(media_player.name, (serviceState) => {
      const volumeValue = this.findLatestAttr(serviceState, 'volume')?.val;
      if (volumeValue != null) {
        this.smartSpeakerService!.updateCharacteristic(
          this.platform.Characteristic.Volume,
          volumeValue,
        );
      }
    });
    this.addUpdateCharacteristicHandler(media_player.name, (serviceState) => {
      const muteValue = this.findLatestAttr(serviceState, 'mute')?.val;
      if (muteValue != null) {
        this.smartSpeakerService!.updateCharacteristic(
          this.platform.Characteristic.Mute,
          muteValue,
        );
      }
    });

    return true;
  }

  buildSmokeSensorService(alarm_fire) {
    if (!alarm_fire) {
      return false;
    }
    this.smokeSensorService = this.smokeSensorService || this.accessory.addService(this.platform.Service.SmokeSensor);
    this.smokeSensorService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    this.addUpdateCharacteristicHandler(alarm_fire.name, (serviceState) => {
      const event = this.findLatestAttr(serviceState, 'alarm')?.val?.event;
      if (event != null) {
        this.smokeSensorService!.updateCharacteristic(
          this.platform.Characteristic.SmokeDetected,
          event === 'smoke' ?
            this.platform.Characteristic.SmokeDetected.SMOKE_DETECTED :
            this.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED,
        );
      }
    });
    return true;
  }

  buildSwitchService(out_bin_switch): boolean {
    if (!out_bin_switch || this.deviceType === 'light') {
      return false;
    }
    this.switchService = this.switchService || this.accessory.addService(this.platform.Service.Switch);
    this.switchService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    const out_bin_switch_cmd_binary_set = out_bin_switch.interfaces?.find(e => e === 'cmd.binary.set');
    if (out_bin_switch_cmd_binary_set) {
      this.addUpdateCharacteristicHandler(out_bin_switch.name, (serviceState) => {
        const binaryValue = this.findLatestAttr(serviceState, 'binary')?.val;
        if (binaryValue != null) {
          this.switchService!.updateCharacteristic(
            this.platform.Characteristic.On,
            binaryValue,
          );
        }
      });
      this.switchService!.getCharacteristic(this.platform.Characteristic.On).onSet(async (value: CharacteristicValue) => {
        await this.platform.sendFimpMsg({
          address: out_bin_switch.address,
          service: out_bin_switch.name,
          cmd: 'cmd.binary.set',
          val: value as boolean,
          val_t: 'bool',
        });
      });
    }
    return true;
  }

  buildTemperatureSensorService(sensor_temp, sensor_wattemp) {
    if (sensor_temp == null && sensor_wattemp == null) {
      return false;
    }
    this.temperatureSensorService = this.temperatureSensorService || this.accessory.addService(this.platform.Service.TemperatureSensor);
    this.temperatureSensorService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    if (sensor_temp != null) {
      this.addUpdateCharacteristicHandler(sensor_temp.name, (serviceState) => {
        const temp = this.findLatestAttr(serviceState, 'sensor')?.val;
        if (temp != null) {
          this.temperatureSensorService!.updateCharacteristic(
            this.platform.Characteristic.CurrentTemperature,
            temp,
          );
        }
      });
    } else if (sensor_wattemp != null) {
      this.addUpdateCharacteristicHandler(sensor_wattemp.name, (serviceState) => {
        const temp = this.findLatestAttr(serviceState, 'sensor')?.val;
        if (temp != null) {
          this.temperatureSensorService!.updateCharacteristic(
            this.platform.Characteristic.CurrentTemperature,
            temp,
          );
        }
      });
    }
    return true;
  }

  buildThermostatService(thermostat, sensor_temp): boolean {
    if (this.deviceType !== 'thermostat') {
      return false;
    }
    this.thermostatService = this.thermostatService || this.accessory.addService(this.platform.Service.Thermostat);
    this.thermostatService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    if (sensor_temp) {
      this.addUpdateCharacteristicHandler(sensor_temp.name, (serviceState) => {
        const tempAttr = this.findLatestAttr(serviceState, 'sensor');
        if (tempAttr != null) {
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.CurrentTemperature,
            tempAttr.val,
          );
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.TemperatureDisplayUnits,
            tempAttr.props.unit === 'C' ?
              this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS :
              this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT,
          );
        }
      });
    }

    const thermostat_cmd_setpoint_set = thermostat?.interfaces?.find(e => e === 'cmd.setpoint.set');
    if (thermostat_cmd_setpoint_set) {
      this.addUpdateCharacteristicHandler(thermostat.name, (serviceState) => {
        const setpointAttr = this.findLatestAttr(serviceState, 'setpoint');
        if (setpointAttr != null) {
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.TargetTemperature,
            setpointAttr.val.temp,
          );
        }
      });

      this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetTemperature).onSet(async (value: CharacteristicValue) => {
        const supModesOrSomething = thermostat.props.sup_setpoints || thermostat.props.sup_states || thermostat.props.sup_modes;

        await this.platform.sendFimpMsg({
          address: thermostat.address,
          service: thermostat.name,
          cmd: 'cmd.setpoint.set',
          val: {
            'temp': (value as number).toString(),
            'type': supModesOrSomething.find(e => e === 'auto') || supModesOrSomething.find(e => e === 'heat') || 'normal',
            'unit': 'C',
          },
          val_t: 'str_map',
        });
      });
    }

    const thermostat_cmd_mode_set = thermostat?.interfaces?.find(e => e === 'cmd.mode.set');
    if (thermostat_cmd_mode_set) {
      this.addUpdateCharacteristicHandler(thermostat.name, (serviceState) => {
        const state = this.findLatestAttr(serviceState, 'state')?.val;
        if (state == null) {
          // do nothing
        } else if (state === 'heat' || state === 'auto' || state === 'eco' || state === 'normal') {
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.CurrentHeatingCoolingState,
            this.platform.Characteristic.CurrentHeatingCoolingState.HEAT,
          );
        } else {
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.CurrentHeatingCoolingState,
            this.platform.Characteristic.CurrentHeatingCoolingState.OFF,
          );
        }

        const mode = this.findLatestAttr(serviceState, 'mode')?.val;
        if (mode == null) {
          // do nothing
        } else if (mode === 'off' || mode === 'sleep' || mode === 'idle') {
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.TargetHeatingCoolingState,
            this.platform.Characteristic.TargetHeatingCoolingState.OFF,
          );
        } else if (mode === 'heat' || mode === 'normal') {
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.TargetHeatingCoolingState,
            this.platform.Characteristic.TargetHeatingCoolingState.HEAT,
          );
        } else if (mode === 'auto') {
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.TargetHeatingCoolingState,
            this.platform.Characteristic.TargetHeatingCoolingState.AUTO,
          );
        } else if (mode === 'cool') {
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.TargetHeatingCoolingState,
            this.platform.Characteristic.TargetHeatingCoolingState.AUTO,
          );
        } else {
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.TargetHeatingCoolingState,
            this.platform.Characteristic.TargetHeatingCoolingState.OFF,
          );
        }
      });

      this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState).onSet(async (value: CharacteristicValue) => {
        if (value === this.platform.Characteristic.TargetHeatingCoolingState.OFF) {
          await this.platform.sendFimpMsg({
            address: thermostat.address,
            service: thermostat.name,
            cmd: 'cmd.mode.set',
            val: thermostat.props.sup_modes.find(e => e === 'off') || 'sleep',
            val_t: 'string',
          });
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.CurrentHeatingCoolingState,
            this.platform.Characteristic.CurrentHeatingCoolingState.OFF,
          );
        } else if (value === this.platform.Characteristic.TargetHeatingCoolingState.HEAT) {
          await this.platform.sendFimpMsg({
            address: thermostat.address,
            service: thermostat.name,
            cmd: 'cmd.mode.set',
            val: thermostat.props.sup_modes.find(e => e === 'heat') || 'normal',
            val_t: 'string',
          });
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.CurrentHeatingCoolingState,
            this.platform.Characteristic.CurrentHeatingCoolingState.HEAT,
          );
        } else if (value === this.platform.Characteristic.TargetHeatingCoolingState.COOL) {
          await this.platform.sendFimpMsg({
            address: thermostat.address,
            service: thermostat.name,
            cmd: 'cmd.mode.set',
            val: thermostat.props.sup_modes.find(e => e === 'cool') || thermostat.props.sup_modes.find(e => e === 'auto') || thermostat.props.sup_modes.find(e => e === 'off') || 'sleep',
            val_t: 'string',
          });
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.CurrentHeatingCoolingState,
            this.platform.Characteristic.CurrentHeatingCoolingState.COOL,
          );
        } else if (value === this.platform.Characteristic.TargetHeatingCoolingState.AUTO) {
          await this.platform.sendFimpMsg({
            address: thermostat.address,
            service: thermostat.name,
            cmd: 'cmd.mode.set',
            val: thermostat.props.sup_modes.find(e => e === 'auto') || 'heat',
            val_t: 'string',
          });
          this.thermostatService!.updateCharacteristic(
            this.platform.Characteristic.CurrentHeatingCoolingState,
            this.platform.Characteristic.CurrentHeatingCoolingState.HEAT,
          );
        }

      });
    }

    return true;
  }

  buildWindowCoveringService(out_lvl_switch, out_bin_switch): boolean {
    if (out_lvl_switch == null && out_bin_switch == null) {
      return false;
    }
    if (this.deviceType !== 'blinds') {
      return false;
    }
    this.windowCoveringService = this.windowCoveringService || this.accessory.addService(this.platform.Service.WindowCovering);
    this.windowCoveringService.updateCharacteristic(this.platform.Characteristic.Name, this.deviceName);

    const out_bin_switch_cmd_binary_set = out_bin_switch?.interfaces?.find(e => e === 'cmd.binary.set');

    const cmd_binary_set = out_lvl_switch?.interfaces?.find(e => e === 'cmd.binary.set');
    const cmd_lvl_set = out_lvl_switch?.interfaces?.find(e => e === 'cmd.lvl.set');
    const minValue = out_lvl_switch?.props?.min_lvl;
    const maxValue = out_lvl_switch?.props?.max_lvl;


    if (out_lvl_switch != null && cmd_lvl_set && minValue != null && maxValue != null) {
      this.addUpdateCharacteristicHandler(out_lvl_switch.name, (serviceState) => {
        const lvlValue = this.findLatestAttr(serviceState, 'lvl')?.val;

        if (lvlValue != null) {
          this.windowCoveringService!.updateCharacteristic(
            this.platform.Characteristic.CurrentPosition,
            this.mapValue(lvlValue, minValue, maxValue, 0, 100),
          );
          this.windowCoveringService!.updateCharacteristic(
            this.platform.Characteristic.TargetPosition,
            this.mapValue(lvlValue, minValue, maxValue, 0, 100),
          );
          this.windowCoveringService!.updateCharacteristic(
            this.platform.Characteristic.PositionState,
            this.platform.Characteristic.PositionState.STOPPED,
          );
        }

      });
      this.windowCoveringService!.getCharacteristic(this.platform.Characteristic.TargetPosition).onSet(async (value: CharacteristicValue) => {
        await this.platform.sendFimpMsg({
          address: out_lvl_switch.address,
          service: out_lvl_switch.name,
          cmd: 'cmd.lvl.set',
          val: this.mapValue(value as number, 0, 100, minValue, maxValue),
          val_t: 'int',
        });
      });
    } else if (out_lvl_switch != null && cmd_binary_set) {
      this.addUpdateCharacteristicHandler(out_lvl_switch.name, (serviceState) => {
        const binaryValue = this.findLatestAttr(serviceState, 'binary')?.val;

        if (binaryValue != null) {
          this.windowCoveringService!.updateCharacteristic(
            this.platform.Characteristic.CurrentPosition,
            binaryValue ? 100 : 0,
          );
          this.windowCoveringService!.updateCharacteristic(
            this.platform.Characteristic.TargetPosition,
            binaryValue ? 100 : 0,
          );
          this.windowCoveringService!.updateCharacteristic(
            this.platform.Characteristic.PositionState,
            this.platform.Characteristic.PositionState.STOPPED,
          );
        }

      });
      this.windowCoveringService!.getCharacteristic(this.platform.Characteristic.TargetPosition).onSet(async (value: CharacteristicValue) => {
        await this.platform.sendFimpMsg({
          address: out_lvl_switch.address,
          service: out_lvl_switch.name,
          cmd: 'cmd.binary.set',
          val: value as number == 0 ? false : true,
          val_t: 'bool',
        });
      });

    } else if (out_bin_switch_cmd_binary_set != null) {
      this.addUpdateCharacteristicHandler(out_bin_switch.name, (serviceState) => {
        const binaryValue = this.findLatestAttr(serviceState, 'binary')?.val;

        if (binaryValue != null) {
          this.windowCoveringService!.updateCharacteristic(
            this.platform.Characteristic.CurrentPosition,
            binaryValue ? 100 : 0,
          );
          this.windowCoveringService!.updateCharacteristic(
            this.platform.Characteristic.TargetPosition,
            binaryValue ? 100 : 0,
          );
          this.windowCoveringService!.updateCharacteristic(
            this.platform.Characteristic.PositionState,
            this.platform.Characteristic.PositionState.STOPPED,
          );
        }

      });
      this.windowCoveringService!.getCharacteristic(this.platform.Characteristic.TargetPosition).onSet(async (value: CharacteristicValue) => {
        await this.platform.sendFimpMsg({
          address: out_bin_switch.address,
          service: out_bin_switch.name,
          cmd: 'cmd.binary.set',
          val: value as number == 0 ? false : true,
          val_t: 'bool',
        });
      });
    }

    return true;
  }

  addUpdateCharacteristicHandler(service: string, handler: (serviceState) => void) {
    if (this.updateCharacteristicHandlers[service]) {
      this.updateCharacteristicHandlers[service].push(handler);
    } else {
      this.updateCharacteristicHandlers[service] = [handler];
    }
  }

  updateDeviceState(deviceState) {
    const services = deviceState.services;
    if (services) {
      for (const serviceState of services) {
        const updateHandlers = this.updateCharacteristicHandlers[serviceState.name];
        if (updateHandlers) {
          updateHandlers.forEach(handler => {
            handler(serviceState);
          });
        }
      }
    }
  }

  // utils

  findLatestAttr(serviceState, attrName) {
    const newValues = serviceState.attributes?.find(e => e.name === attrName)?.values;
    return this.findLatest(newValues);
  }

  /// Find latest object in array using `ts` timestamp property.
  findLatest(array?: any[]): any {
    if (array == null) {
      return null;
    }

    if (array.length === 1) {
      return array[0];
    }
    return array.reduce((latest, current) => {
      const currentTs = current.ts ? new Date(current.ts) : null;
      const latestTs = latest?.ts ? new Date(latest.ts) : null;
      return (!latestTs || (currentTs && currentTs > latestTs)) ? current : latest;
    }, undefined);
  }

  mapValue(x: number, min1: number, max1: number, min2: number, max2: number) {
    return (x - min1) * (max2 - min2) / (max1 - min1) + min2;
  }
}
