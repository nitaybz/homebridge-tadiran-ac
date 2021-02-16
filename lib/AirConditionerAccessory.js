const BaseAccessory = require('./BaseAccessory');

const STATE_OTHER = 9;

class AirConditionerAccessory extends BaseAccessory {
    static getCategory(Categories) {
        return Categories.AIR_CONDITIONER;
    }

    constructor(...props) {
        super(...props);

        this.cmdCool = 'cooling'; 
        if (this.device.context.cmdCool) {
            if (/^c[a-z]+$/i.test(this.device.context.cmdCool)) this.cmdCool = ('' + this.device.context.cmdCool).trim();
            else throw new Error('The cmdCool doesn\'t appear to be valid: ' + this.device.context.cmdCool);
        }

        this.cmdHeat = 'heating';
        if (this.device.context.cmdHeat) {
            if (/^h[a-z]+$/i.test(this.device.context.cmdHeat)) this.cmdHeat = ('' + this.device.context.cmdHeat).trim();
            else throw new Error('The cmdHeat doesn\'t appear to be valid: ' + this.device.context.cmdHeat);
        }

        this.cmdAuto = 'auto';
        if (this.device.context.cmdAuto) {
            if (/^a[a-z]+$/i.test(this.device.context.cmdAuto)) this.cmdAuto = ('' + this.device.context.cmdAuto).trim();
            else throw new Error('The cmdAuto doesn\'t appear to be valid: ' + this.device.context.cmdAuto);
        }

        this.cmdFan = 'fan';
        if (this.device.context.cmdAuto) {
            if (/^a[a-z]+$/i.test(this.device.context.cmdFan)) this.cmdFan = ('' + this.device.context.cmdFan).trim();
            else throw new Error('The cmdFan doesn\'t appear to be valid: ' + this.device.context.cmdFan);
        }

        this.cmdDry = 'dehum';
        if (this.device.context.cmdDry) {
            if (/^a[a-z]+$/i.test(this.device.context.cmdDry)) this.cmdDry = ('' + this.device.context.cmdDry).trim();
            else throw new Error('The cmdDry doesn\'t appear to be valid: ' + this.device.context.cmdDry);
        }


        // hard coded for tadiran
        this._rotationSteps = ["auto","low","middle","high"]
    }

    _registerPlatformAccessory() {
        const {Service} = this.hap;

        this.accessory.addService(Service.HeaterCooler, this.device.context.name);
        
        if (!this.device.context.noFan)
            this.accessory.addService(Service.Fanv2, this.device.context.name + ' Fan');
        else
            this.accessory.removeService(Service.Fanv2);

        if (!this.device.context.noDry)
            this.accessory.addService(Service.HumidifierDehumidifier, this.device.context.name + ' Dry');
        else
            this.accessory.removeService(Service.HumidifierDehumidifier);

        super._registerPlatformAccessory();
    }

    _registerCharacteristics(dps) {
        const {Service, Characteristic} = this.hap;
        const service = this.accessory.getService(Service.HeaterCooler);
        const fanService = this.accessory.getService(Service.Fanv2);
        const dryService = this.accessory.getService(Service.HumidifierDehumidifier);
        this._checkServiceName(service, this.device.context.name);

        const characteristicActive = service.getCharacteristic(Characteristic.Active)
            .updateValue(this._getActive(dps['1']))
            .on('get', this.getActive.bind(this))
            .on('set', this.setActive.bind(this));

        const characteristicCurrentHeaterCoolerState = service.getCharacteristic(Characteristic.CurrentHeaterCoolerState)
            .updateValue(this._getCurrentHeaterCoolerState(dps))
            .on('get', this.getCurrentHeaterCoolerState.bind(this));

        const _validTargetHeaterCoolerStateValues = [STATE_OTHER];
        if (!this.device.context.noCool) _validTargetHeaterCoolerStateValues.unshift(Characteristic.TargetHeaterCoolerState.COOL);
        if (!this.device.context.noHeat) _validTargetHeaterCoolerStateValues.unshift(Characteristic.TargetHeaterCoolerState.HEAT);
        if (!this.device.context.noAuto) _validTargetHeaterCoolerStateValues.unshift(Characteristic.TargetHeaterCoolerState.AUTO);

        const characteristicTargetHeaterCoolerState = service.getCharacteristic(Characteristic.TargetHeaterCoolerState)
            .setProps({
                maxValue: 9,
                validValues: _validTargetHeaterCoolerStateValues
            })
            .updateValue(this._getTargetHeaterCoolerState(dps['4']))
            .on('get', this.getTargetHeaterCoolerState.bind(this))
            .on('set', this.setTargetHeaterCoolerState.bind(this));

        const characteristicCurrentTemperature = service.getCharacteristic(Characteristic.CurrentTemperature)
            .updateValue(dps['3']/10)
            .on('get', this.getCurrentTemperature.bind(this));

        let characteristicSwingMode;
        if (!this.device.context.noSwing) {
            characteristicSwingMode = service.getCharacteristic(Characteristic.SwingMode)
                .updateValue(this._getSwingMode(dps['104']))
                .on('get', this.getSwingMode.bind(this))
                .on('set', this.setSwingMode.bind(this));
        } else this._removeCharacteristic(service, Characteristic.SwingMode);

        let characteristicCoolingThresholdTemperature;
        if (!this.device.context.noCool) {
            characteristicCoolingThresholdTemperature = service.getCharacteristic(Characteristic.CoolingThresholdTemperature)
                .setProps({
                    minValue: this.device.context.minTemperature || 16,
                    maxValue: this.device.context.maxTemperature || 32,
                    minStep: this.device.context.minTemperatureSteps || 1
                })
                .updateValue(dps['2'])
                .on('get', this.getState.bind(this, '2'))
                .on('set', this.setTargetThresholdTemperature.bind(this, 'cool'));
        } else this._removeCharacteristic(service, Characteristic.CoolingThresholdTemperature);

        let characteristicHeatingThresholdTemperature;
        if (!this.device.context.noHeat) {
            characteristicHeatingThresholdTemperature = service.getCharacteristic(Characteristic.HeatingThresholdTemperature)
                .setProps({
                    minValue: this.device.context.minTemperature || 16,
                    maxValue: this.device.context.maxTemperature || 32,
                    minStep: this.device.context.minTemperatureSteps || 1
                })
                .updateValue(dps['2'])
                .on('get', this.getState.bind(this, '2'))
                .on('set', this.setTargetThresholdTemperature.bind(this, 'heat'));
        } else this._removeCharacteristic(service, Characteristic.HeatingThresholdTemperature);

        let characteristicRotationSpeed;
        if (!this.device.context.noFanSpeed) {
            characteristicRotationSpeed = service.getCharacteristic(Characteristic.RotationSpeed)
                .updateValue(this._getRotationSpeed(dps))
                .on('get', this.getRotationSpeed.bind(this))
                .on('set', this.setRotationSpeed.bind(this));
        } else this._removeCharacteristic(service, Characteristic.RotationSpeed);

        this.characteristicCoolingThresholdTemperature = characteristicCoolingThresholdTemperature;
        this.characteristicHeatingThresholdTemperature = characteristicHeatingThresholdTemperature;

        if (fanService) {
            const fanCharacteristicActive = fanService.getCharacteristic(Characteristic.Active)
                .updateValue(this._getFanActive(dps))
                .on('get', this.getFanActive.bind(this))
                .on('set', this.getFanActive.bind(this));

            let fanCharacteristicSwingMode;
            if (!this.device.context.noSwing) {
                fanCharacteristicSwingMode = fanService.getCharacteristic(Characteristic.SwingMode)
                    .updateValue(this._getSwingMode(dps['104']))
                    .on('get', this.getSwingMode.bind(this))
                    .on('set', this.setSwingMode.bind(this));
            } else this._removeCharacteristic(fanService, Characteristic.SwingMode);

            let fanCharacteristicRotationSpeed;
            if (!this.device.context.noFanSpeed) {
                fanCharacteristicRotationSpeed = fanService.getCharacteristic(Characteristic.RotationSpeed)
                    .updateValue(this._getRotationSpeed(dps))
                    .on('get', this.getRotationSpeed.bind(this))
                    .on('set', this.setRotationSpeed.bind(this));
            } else this._removeCharacteristic(fanService, Characteristic.RotationSpeed);
        }

        
        if (dryService) {
            const dryCharacteristicActive = dryService.getCharacteristic(Characteristic.Active)
                .updateValue(this._getFanActive(dps))
                .on('get', this.getDryActive.bind(this))
                .on('set', this.getDryActive.bind(this));
                

            dryService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
                .updateValue(0)
                .on('get', callback => callback(0))

                
            const dryCharacteristicCurrentHumidifierDehumidifierState = dryService.getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState)
                .on('get', this.getCurrentHumidifierDehumidifierState.bind(this))

            dryService.getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
                .setProps({
                    minValue: 2,
                    maxValue: 2,
                    validValues: [Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER]
                })
                .on('get', callback => callback(Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER))
                

            let dryCharacteristicSwingMode;
            if (!this.device.context.noSwing) {
                dryCharacteristicSwingMode = dryService.getCharacteristic(Characteristic.SwingMode)
                    .updateValue(this._getSwingMode(dps['104']))
                    .on('get', this.getSwingMode.bind(this))
                    .on('set', this.setSwingMode.bind(this));
            } else this._removeCharacteristic(dryService, Characteristic.SwingMode);

            let dryCharacteristicRotationSpeed;
            if (!this.device.context.noFanSpeed) {
                dryCharacteristicRotationSpeed = dryService.getCharacteristic(Characteristic.RotationSpeed)
                    .updateValue(this._getRotationSpeed(dps))
                    .on('get', this.getRotationSpeed.bind(this))
                    .on('set', this.setRotationSpeed.bind(this));
            } else this._removeCharacteristic(dryService, Characteristic.RotationSpeed);

        }

        this.device.on('change', (changes, state) => {
            if (changes.hasOwnProperty('1') || changes.hasOwnProperty('4')) {
                characteristicActive.updateValue(this._getActive(state));
                if (fanService)
                    fanCharacteristicActive.updateValue(this._getFanActive(state));
                if (dryService)
                    dryCharacteristicActive.updateValue(this._getDryActive(state));
            }

            if (changes.hasOwnProperty('2')) {
                if (!this.device.context.noCool && characteristicCoolingThresholdTemperature && characteristicCoolingThresholdTemperature.value !== changes['2'])
                    characteristicCoolingThresholdTemperature.updateValue(changes['2']);
                if (!this.device.context.noHeat && characteristicHeatingThresholdTemperature && characteristicHeatingThresholdTemperature.value !== changes['2'])
                    characteristicHeatingThresholdTemperature.updateValue(changes['2']);
            }

            if (changes.hasOwnProperty('3') && characteristicCurrentTemperature.value !== changes['3']) characteristicCurrentTemperature.updateValue(changes['3']/10);

            if (changes.hasOwnProperty('4')) {
                const newTargetHeaterCoolerState = this._getTargetHeaterCoolerState(changes['4']);
                const newCurrentHeaterCoolerState = this._getCurrentHeaterCoolerState(state);
                if (characteristicTargetHeaterCoolerState.value !== newTargetHeaterCoolerState) characteristicTargetHeaterCoolerState.updateValue(newTargetHeaterCoolerState);
                if (characteristicCurrentHeaterCoolerState.value !== newCurrentHeaterCoolerState) characteristicCurrentHeaterCoolerState.updateValue(newCurrentHeaterCoolerState);
            }

            if (changes.hasOwnProperty('104') && !this.device.context.noSwing) {
                const newSwingMode = this._getSwingMode(changes['104']);
                characteristicSwingMode.updateValue(newSwingMode);
                if (fanService)
                    fanCharacteristicSwingMode.updateValue(newSwingMode);
                if (dryService)
                    dryCharacteristicSwingMode.updateValue(newSwingMode);
            }

            if (changes.hasOwnProperty('5')) {
                const newRotationSpeed = this._getRotationSpeed(state);
                if (characteristicRotationSpeed.value !== newRotationSpeed) {
                    characteristicRotationSpeed.updateValue(newRotationSpeed);
                    if (fanService)
                        fanCharacteristicRotationSpeed.updateValue(newRotationSpeed);
                    if (dryService)
                        dryCharacteristicRotationSpeed.updateValue(newRotationSpeed);
                }
            }
        });
    }

    getActive(callback) {
        this.getState('1', '4', (err, dp) => {
            if (err) return callback(err);

            callback(null, this._getActive(dps));
        });
    }

    _getActive(dps) {
        const {Characteristic} = this.hap;
        if (!dps['1']) return Characteristic.CurrentHeaterCoolerState.INACTIVE;

        switch (dps['4']) {
            case this.cmdCool:
                return Characteristic.Active.ACTIVE;

            case this.cmdHeat:
                return Characteristic.Active.ACTIVE;
                
            case this.cmdAuto:
                return Characteristic.Active.ACTIVE;

            default:
                return Characteristic.CurrentHeaterCoolerState.INACTIVE;
        }


        if (!dps['1'] || dps['4'] !== this.cmdFan) return Characteristic.Active.INACTIVE;
        return Characteristic.Active.ACTIVE;
    }

    setActive(value, callback) {
        const {Characteristic} = this.hap;

        switch (value) {
            case Characteristic.Active.ACTIVE:
                return this.setMultiState({'4': this.cmdAuto, '1': true}, callback);

            case Characteristic.Active.INACTIVE:
                return this.setState('1', false, callback);
        }
        callback();
    }
    

    getCurrentTemperature(callback) {
        this.getState('3', (err, dp) => {
            if (err) return callback(err);

            callback(null, this._getCurrentTemperature(dp));
        });
    }

    _getCurrentTemperature(dp) {
        return dp/10;
    }

    getCurrentHeaterCoolerState(callback) {
        this.getState(['1', '2', '3', '4'], (err, dps) => {
            if (err) return callback(err);

            callback(null, this._getCurrentHeaterCoolerState(dps));
        });
    }

    _getCurrentHeaterCoolerState(dps) {
        const {Characteristic} = this.hap;
        if (!dps['1']) return Characteristic.CurrentHeaterCoolerState.INACTIVE;

        switch (dps['4']) {
            case this.cmdCool:
                return Characteristic.CurrentHeaterCoolerState.COOLING;

            case this.cmdHeat:
                return Characteristic.CurrentHeaterCoolerState.HEATING;
                
            case this.cmdAuto:
                if ((dps['3']/10) < dps['2'])
                    return Characteristic.CurrentHeaterCoolerState.HEATING;
                else
                    return Characteristic.CurrentHeaterCoolerState.COOLING;

            default:
                return Characteristic.CurrentHeaterCoolerState.IDLE;
        }
    }

    getTargetHeaterCoolerState(callback) {
        this.getState('4', (err, dp) => {
            if (err) return callback(err);

            callback(null, this._getTargetHeaterCoolerState(dp));
        });
    }

    _getTargetHeaterCoolerState(dp) {
        const {Characteristic} = this.hap;

        switch (dp) {
            case this.cmdCool:
                if (this.device.context.noCool) return STATE_OTHER;
                return Characteristic.TargetHeaterCoolerState.COOL;

            case this.cmdHeat:
                if (this.device.context.noHeat) return STATE_OTHER;
                return Characteristic.TargetHeaterCoolerState.HEAT;

            case this.cmdAuto:
                if (this.device.context.noAuto) return STATE_OTHER;
                return Characteristic.TargetHeaterCoolerState.AUTO;

            default:
                return STATE_OTHER;
        }
    }

    setTargetHeaterCoolerState(value, callback) {
        const {Characteristic} = this.hap;

        switch (value) {
            case Characteristic.TargetHeaterCoolerState.COOL:
                if (this.device.context.noCool) return callback();
                return this.setState('4', this.cmdCool, callback);

            case Characteristic.TargetHeaterCoolerState.HEAT:
                if (this.device.context.noHeat) return callback();
                return this.setState('4', this.cmdHeat, callback);

            case Characteristic.TargetHeaterCoolerState.AUTO:
                if (this.device.context.noAuto) return callback();
                return this.setState('4', this.cmdAuto, callback);
        }

        callback();
    }

    getSwingMode(callback) {
        this.getState('104', (err, dp) => {
            if (err) return callback(err);

            callback(null, this._getSwingMode(dp));
        });
    }

    _getSwingMode(dp) {
        const {Characteristic} = this.hap;

        return dp ? Characteristic.SwingMode.SWING_ENABLED : Characteristic.SwingMode.SWING_DISABLED;
    }

    setSwingMode(value, callback) {
        if (this.device.context.noSwing) return callback();

        const {Characteristic} = this.hap;

        switch (value) {
            case Characteristic.SwingMode.SWING_ENABLED:
                return this.setState('104', true, callback);

            case Characteristic.SwingMode.SWING_DISABLED:
                return this.setState('104', false, callback);
        }

        callback();
    }

    setTargetThresholdTemperature(mode, value, callback) {
        this.setState('2', value, err => {
            if (err) return callback(err);

            if (mode === 'cool' && !this.device.context.noHeat && this.characteristicHeatingThresholdTemperature) {
                this.characteristicHeatingThresholdTemperature.updateValue(value);
            } else if (mode === 'heat' && !this.device.context.noCool && this.characteristicCoolingThresholdTemperature) {
                this.characteristicCoolingThresholdTemperature.updateValue(value);
            }

            callback();
        });
    }

    getRotationSpeed(callback) {
        this.getState(['1', '5'], (err, dps) => {
            if (err) return callback(err);

            callback(null, this._getRotationSpeed(dps));
        });
    }

    _getRotationSpeed(dps) {
        if (this._hkRotationSpeed) {
            const currntRotationSpeed = this.convertRotationSpeedFromHomeKitToTuya(this._hkRotationSpeed);

            return currntRotationSpeed === dps['5'] ? this._hkRotationSpeed : this.convertRotationSpeedFromTuyaToHomeKit(dps['5']);
        }

        return this._hkRotationSpeed = this.convertRotationSpeedFromTuyaToHomeKit(dps['5']);
    }

    setRotationSpeed(value, callback) {
        const {Characteristic} = this.hap;

        if (value === 0) {
            this.setActive(Characteristic.Active.INACTIVE, callback);
        } else {
            this._hkRotationSpeed = value;
            this.setMultiState({'1': true, '5': this.convertRotationSpeedFromHomeKitToTuya(value)}, callback);
        }
    }
    
    getFanActive(callback) {
        this.getState(['1', '4'], (err, dps) => {
            if (err) return callback(err);

            callback(null, this._getFanActive(dps));
        });
    }

    _getFanActive(dps) {
        const {Characteristic} = this.hap;
        if (!dps['1'] || dps['4'] !== this.cmdFan) return Characteristic.Active.INACTIVE;
        return Characteristic.Active.ACTIVE;
    }

    setFanActive(value, callback) {
        const {Characteristic} = this.hap;

        switch (value) {
            case Characteristic.Active.ACTIVE:
                return this.setMultiState({'4': this.cmdFan, '1': true}, callback);

            case Characteristic.Active.INACTIVE:
                return this.setState('1', false, callback);
        }
        callback();
    }
    
    
    getDryActive(callback) {
        this.getState(['1', '4'], (err, dps) => {
            if (err) return callback(err);

            callback(null, this._getDryActive(dps));
        });
    }

    _getDryActive(dps) {
        const {Characteristic} = this.hap;
        if (!dps['1'] || dps['4'] !== this.cmdDry) return Characteristic.Active.INACTIVE;
        return Characteristic.Active.ACTIVE;
    }

    setDryActive(value, callback) {
        const {Characteristic} = this.hap;

        switch (value) {
            case Characteristic.Active.ACTIVE:
                return this.setMultiState({'4': this.cmdDry, '1': true}, callback);

            case Characteristic.Active.INACTIVE:
                return this.setState('1', false, callback);
        }
        callback();
    }

    getCurrentHumidifierDehumidifierState(callback) {
        this.getState(['1', '4'], (err, dps) => {
            if (err) return callback(err);

            callback(null, this._getCurrentHumidifierDehumidifierState(dps));
        });
    }

    _getCurrentHumidifierDehumidifierState(dps) {
        const {Characteristic} = this.hap;
        if (!dps['1'] || dps['4'] !== this.cmdDry) return Characteristic.CurrentHumidifierDehumidifierState.INACTIVE;
        return Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING;
    }

    convertRotationSpeedFromTuyaToHomeKit(value) {
        return Math.round(100 * (this._rotationSteps.indexOf(value) + 1) / this._rotationSteps.length)

    }

    convertRotationSpeedFromHomeKitToTuya(value) {
        let selected = this._rotationSteps[0]
        const totalLevels = this._rotationSteps.length
        for (let i = 0; i < totalLevels; i++) {
            if (value <= (100 * (i + 1) / totalLevels))	{
                selected = this._rotationSteps[i]
                break
            }
        }
        return selected
    }
}

module.exports = AirConditionerAccessory;