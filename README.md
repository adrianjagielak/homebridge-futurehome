<p align="center">
   <a href="https://github.com/adrianjagielak/homebridge-futurehome"><img alt="Homebridge Verified" src="https://github.com/adrianjagielak/homebridge-futurehome/raw/latest/assets/homebridge_futurehome_logo.png" width="600px"></a>
</p>
<span align="center">

# homebridge-futurehome

Homebridge plugin to integrate [Futurehome](https://www.futurehome.io) devices into HomeKit

[![npm](https://img.shields.io/npm/v/homebridge-futurehome/latest?label=latest)](https://www.npmjs.com/package/homebridge-futurehome)
[![npm](https://img.shields.io/npm/dt/homebridge-futurehome)](https://www.npmjs.com/package/homebridge-futurehome)

</span>

This plugin uses the official public [FIMP API](https://github.com/futurehomeno/fimp-api) to communicate with the Futurehome Smarthub and expose all of the devices in Apple Home.

As of now, it supports a selection of services and device types, but it should be pretty easy to map new [Futurehome device services](https://github.com/futurehomeno/fimp-api/tree/master/device_services/generic) into [HomeKit services](https://developers.homebridge.io/#/service).

If you have any suggestions, questions, or non-working devices or services please [open an issue](https://github.com/adrianjagielak/homebridge-futurehome/issues).

# Futurehome Device Services Compatibility Chart

This chart lists all services supported by the Futurehome hub, along with their current implementation status.  

Devices commonly consist of multiple services: for example, a presence sensor might expose a `sensor_presence` service with a `presence` (true/false) value, and also a `battery` service if it is battery-powered.

Some services are more common than others. Some are deprecated entirely.


| Service | Example device | Implemented in any capacity | Full implementation verified |
| --- | --- | --- | --- |
| alarm_appliance | | ✅ | |
| alarm_burglar | | ✅ | |
| alarm_emergency | | ✅ | |
| alarm_fire | | ✅ | |
| alarm_gas | | ✅ | |
| alarm_health | | ✅ | |
| alarm_heat | | ✅ | |
| alarm_lock | | ✅ | |
| alarm_power | | ✅ | |
| alarm_siren | | ✅ | |
| alarm_system | | ✅ | |
| alarm_time | | ✅ | |
| alarm_water | | ✅ | |
| alarm_water_valve | | ✅ | |
| alarm_weather | | ✅ | |
| appliance | | | |
| barrier_ctrl | | ✅ | |
| basic | | ✅ | |
| battery | | ✅ | |
| blinds | | | |
| boiler | | | |
| chargepoint | [Futurehome Charge](https://www.futurehome.io/en_no/shop/charge) | ✅ | |
| color_ctrl | | ✅ | |
| complex_alarm_system | | ✅ | |
| dev_sys | | ✅ | |
| door_lock | |  | |
| doorman | | ✅ | |
| fan | | | |
| fan_ctrl | | ✅ | |
| fire_detector | | | |
| garage_door | | | |
| gas_detector | | | |
| gate | | | |
| gateway | | ✅ | |
| heat_detector | | | |
| heat_pump | | | |
| heater | | | |
| input | | | |
| leak_detector | | | |
| light | | | |
| media_player | | ✅ | |
| meter | | | |
| meter_elec | [HAN-Sensor](https://www.futurehome.io/en/shop/han-sensor) | ✅ | |
| meter_gas | | ✅ | |
| meter_water | | ✅ | |
| ota | | ✅ | |
| out_bin_switch | | ✅ | |
| out_lvl_switch | [Smart LED Dimmer](https://www.futurehome.io/en_no/shop/smart-led-dimmer-polar-white) | ✅ | |
| parameters | | ✅ | |
| power_regulator | | | |
| scene_ctrl | | ✅ | |
| sensor | | | |
| sensor_accelx | | ✅ | |
| sensor_accely | | ✅ | |
| sensor_accelz | | ✅ | |
| sensor_airflow | | ✅ | |
| sensor_anglepos | | ✅ | |
| sensor_atmo | | ✅ | |
| sensor_baro | | ✅ | |
| sensor_co | | ✅ | |
| sensor_co2 | | ✅ | |
| sensor_contact | | ✅ | |
| sensor_current | | ✅ | |
| sensor_dew | | ✅ | |
| sensor_direct | | ✅ | |
| sensor_distance | | ✅ | |
| sensor_elresist | | ✅ | |
| sensor_freq | | ✅ | |
| sensor_gp | | ✅ | |
| sensor_gust | | ✅ | |
| sensor_humid | | ✅ | |
| sensor_lumin | | ✅ | |
| sensor_moist | | ✅ | |
| sensor_noise | | ✅ | |
| sensor_power | | ✅ | |
| sensor_presence | | ✅ | |
| sensor_rain | | ✅ | |
| sensor_rotation | | ✅ | |
| sensor_seismicint | | ✅ | |
| sensor_seismicmag | | ✅ | |
| sensor_solarrad | | ✅ | |
| sensor_tank | | ✅ | |
| sensor_temp | | ✅ | |
| sensor_tidelvl | | ✅ | |
| sensor_uv | | ✅ | |
| sensor_veloc | | ✅ | |
| sensor_voltage | | ✅ | |
| sensor_watflow | | ✅ | |
| sensor_watpressure | | ✅ | |
| sensor_wattemp | | ✅ | |
| sensor_weight | | ✅ | |
| sensor_wind | | ✅ | |
| siren | | | |
| siren_ctrl | | ✅ | |
| thermostat | [Thermostat](https://www.futurehome.io/en_no/shop/thermostat-w) | ✅ | |
| user_code | | ✅ | |
| virtual_meter_elec | | ✅ | |
| water_heater | | ✅ | |
| water_valve | | | |



#

Go check out my other Homebridge plugins:

* [homebridge-futurehome](https://github.com/adrianjagielak/homebridge-futurehome) ([npm](https://npmjs.com/package/homebridge-futurehome))
* [homebridge-tuya-plus](https://github.com/adrianjagielak/homebridge-tuya-plus) ([npm](https://npmjs.com/package/homebridge-tuya-plus))
* [homebridge-eqiva-swift-bridge](https://github.com/adrianjagielak/eqiva-smart-lock-bridge) ([npm](https://npmjs.com/package/homebridge-eqiva-swift-bridge))
* [homebridge-intex-plus](https://github.com/adrianjagielak/homebridge-intex-plus) ([npm](https://npmjs.com/package/homebridge-intex-plus))
* [homebridge-simple-router-status](https://github.com/adrianjagielak/homebridge-simple-router-status) ([npm](https://npmjs.com/package/homebridge-simple-router-status))
