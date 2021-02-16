<img src="branding/tadiran_homebridge.png" width="500px">



# homebridge-tadiran-ac

[![Downloads](https://img.shields.io/npm/dt/homebridge-tadiran-ac.svg?color=critical)](https://www.npmjs.com/package/homebridge-tadiran-ac)
[![Version](https://img.shields.io/npm/v/homebridge-tadiran-ac)](https://www.npmjs.com/package/homebridge-tadiran-ac)<br>
<!-- [![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins) [![Homebridge Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/yguuVAX)<br>
[![certified-hoobs-plugin](https://badgen.net/badge/HOOBS/Certified/yellow)](https://plugins.hoobs.org?ref=10876) [![hoobs-support](https://badgen.net/badge/HOOBS/Support/yellow)](https://support.hoobs.org?ref=10876) -->


[Homebridge](https://github.com/nfarina/homebridge) plugin for Tadiran AC units controlled by the Tuya Smart app

<img src="branding/product.jpg" width="300px">


Known to work:
Tadiran IoT
<img src="branding/device.jpg" width="160px">

### Requirements

<img src="https://img.shields.io/badge/node-%3E%3D10.17-brightgreen"> &nbsp;
<img src="https://img.shields.io/badge/homebridge-%3E%3D0.4.4-brightgreen"> &nbsp;
<img src="https://img.shields.io/badge/iOS-%3E%3D11.0.0-brightgreen">

\* Device must be connected and controlled by the Tuya Smart app.

check with: `node -v` & `homebridge -V` and update if needed



## Installation 
To use this plugin, follow the steps below:

1. Install homebridge using: `sudo npm install -g homebridge --unsafe-perm`
2. Install this plugin using: `sudo npm install -g homebridge-tadiran-ac`
3. Update your configuration file. See `config-sample.json` in this repository for a sample.

**To get ID and Key** Watch [this](https://www.youtube.com/watch?v=oq0JL_wicKg) video. 






### Fan speeds & "AUTO" speed

Available fan speeds are: AUTO, LOW, MIDDLE, HIGH.
 Since HomeKit control over fan speed is with a slider between 0-100, the plugin converts the steps you have in the Tadiran app to values between 1 to 100, when 100 is highest and 1 is auto. setting fan speed to zero will shut off the device

### Issues & Debug
If you experience any issues with the plugins please refer to the [Issues](https://github.com/nitaybz/homebridge-tadiran-ac/issues) tab or [Tadiran-AC Discord channel](https://discord.gg/yguuVAX) and check if your issue is already described there, if it doesn't, please create a new issue with as much detailed information as you can give (logs are crucial).<br>

if you want to even speed up the process, you can add `"debug": true` to your config, which will give me more details on the logs and speed up fixing the issue.

<br>

## Support homebridge-tadiran-ac

**homebridge-tadiran-ac** is a free plugin under the GNU license. it was developed as a contribution to the homebridge/hoobs community with lots of love and thoughts.
Creating and maintaining Homebridge plugins consume a lot of time and effort and if you would like to share your appreciation, feel free to "Star" or donate. 

<a target="blank" href="https://www.paypal.me/nitaybz"><img src="https://img.shields.io/badge/PayPal-Donate-blue.svg?logo=paypal"/></a><br>
<a target="blank" href="https://www.patreon.com/nitaybz"><img src="https://img.shields.io/badge/PATREON-Become a patron-red.svg?logo=patreon"/></a><br>
<a target="blank" href="https://ko-fi.com/nitaybz"><img src="https://img.shields.io/badge/Ko--Fi-Buy%20me%20a%20coffee-29abe0.svg?logo=ko-fi"/></a>


## Credits

CodeTheWeb - Original tuya repo
Amoo-Miki  - Tuya plugin core
Rayan Khan  - Tuya plugin improvements
