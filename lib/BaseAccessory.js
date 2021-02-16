class BaseAccessory {
	constructor(...props) {
		let isNew;
		[this.platform, this.accessory, this.device, isNew = true] = [...props];
		({log: this.log, api: {hap: this.hap}} = this.platform);
		this.log.debug(`new Device: ${this.device.context}`)

		if (isNew) this._registerPlatformAccessory();

		this.accessory.on('identify', function(paired, callback) {
			// ToDo: Add identification routine
			this.log("%s - identify", this.device.context.name);
			callback();
		}.bind(this));

		this.device.once('connect', () => {
			this.log('Connected to', this.device.context.name);
		});

		this.device.once('change', () => {
			this.log(`Ready to handle ${this.device.context.name} (AC Unit:${this.device.context.version}) with signature ${JSON.stringify(this.device.state)}`);

			this._registerCharacteristics(this.device.state);
		});

		this.device._connect();
	}

	_registerPlatformAccessory() {
		this.platform.registerPlatformAccessories(this.accessory);
	}

	_checkServiceName(service, name) {
		const {Characteristic} = this.hap;

		if (service.displayName !== name) {
			const nameCharacteristic = service.getCharacteristic(Characteristic.Name) || service.addCharacteristic(Characteristic.Name);
			nameCharacteristic.setValue(name);
			service.displayName = name;
		}
	}

	_removeCharacteristic(service, characteristicType) {
		if (!service || !characteristicType || !characteristicType.UUID) return;

		service.characteristics.some(characteristic => {
			if (!characteristic || characteristic.UUID !== characteristicType.UUID) return false;
			service.removeCharacteristic(characteristic);
			return true;
		});
	}

	_getCustomDP(numeral) {
		return (isFinite(numeral) && parseInt(numeral) > 0) ? String(numeral) : false;
	}

	_coerceBoolean(b, defaultValue) {
		const df = defaultValue || false;
		return typeof b === 'boolean' ? b : (typeof b === 'string' ? b.toLowerCase().trim() === 'true' : (typeof b === 'number' ? b !== 0 : df));
	}

	getState(dp, callback) {
		if (!this.device.connected) return callback(true);
		const _callback = () => {
			if (Array.isArray(dp)) {
				const ret = {};
				dp.forEach(p => {
					ret[p] = this.device.state[p];
				});
				callback(null, ret);
			} else {
				callback(null, this.device.state[dp]);
			}
		};

		process.nextTick(_callback);
	}

	setState(dp, value, callback) {
		this.setMultiState({[dp.toString()]: value}, callback);
	}

	setMultiState(dps, callback) {
		if (!this.device.connected) return callback(true);

		const ret = this.device.update(dps);
		callback && callback(!ret);
	}
}

module.exports = BaseAccessory;