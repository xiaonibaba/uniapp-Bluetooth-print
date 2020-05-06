class Bluetooth {

	constructor() {
		this.isOpenBle = false;
		this.deviceId = "";
		this.serviceId = "";
		this.writeId = "";
		this.notifyId = "";
		this.openBluetoothAdapter();
	}


	get_deviceId() {
		return uni.getStorageSync("deviceId") || "";
	}

	set_deviceId(deviceId) {
		this.deviceId = deviceId;
		uni.setStorageSync(deviceId);
	}

	get_serviceId() {
		return uni.getStorageSync("serviceId") || "";
	}

	set_serviceId(serviceId) {
		this.serviceId = serviceId;
		uni.setStorageSync(serviceId);
	}

	get_writeId() {
		return uni.getStorageSync("writeId") || "";
	}

	set_writeId(writeId) {
		this.writeId = writeId;
		uni.setStorageSync(writeId);
	}

	get_notifyId() {
		return uni.getStorageSync("notifyId") || "";
	}

	set_notifyId(notifyId) {
		this.notifyId = notifyId;
		uni.setStorageSync(notifyId);
	}


	showToast(title) {
		uni.showToast({
			title: title,
			icon: 'none',
			'duration': 2000
		});
	}

	openBluetoothAdapter() {
		return new Promise((resolve, reject) => {
			uni.openBluetoothAdapter({
				success: res => {
					this.isOpenBle = true;
					this.showToast("初始化蓝牙模块成功");
					resolve(res);
				},
				fail: err => {
					this.showToast(`初始化蓝牙模块失败` + JSON.stringify(err));
					reject(err);
				},
			});
		});

	}

	startBluetoothDevicesDiscovery() {
		if (!this.isOpenBle) {
			this.showToast(`初始化蓝牙模块失败`)
			return;
		}

		let self = this;
		uni.showLoading({
			title: '蓝牙搜索中'
		})
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				uni.startBluetoothDevicesDiscovery({
					success: res => {
						resolve(res)
					},
					fail: res => {
						self.showToast(`搜索设备失败` + JSON.stringify(err));
						reject(err);
					}
				})
			}, 300);
		});
	}

	stopBluetoothDevicesDiscovery() {
		return new Promise((resolve, reject) => {
			uni.stopBluetoothDevicesDiscovery({
				success: res => {
					resolve(res);
				},
				fail: err => {
					reject(err);
				}
			})
		});
	}

	createBLEConnection() {
		//设备deviceId
		let deviceId = this.get_deviceId();;
		let self = this;

		uni.showLoading({
			mask: true,
			title: '设别连接中,请稍候...'
		})
		console.log(this.deviceId);
		return new Promise((resolve, reject) => {
			uni.createBLEConnection({
				deviceId,
				success: (res) => {
					console.log("res:createBLEConnection " + JSON.stringify(res));
					resolve(res)
				},
				fail: err => {
					uni.hideLoading();
					self.showToast(`停止搜索蓝牙设备失败` + JSON.stringify(err));
					reject(err);
				}
			})
		});
	}

	//获取蓝牙设备所有服务(service)
	getBLEDeviceServices() {
		let _serviceList = [];
		let deviceId = this.get_deviceId();
		let self = this;

		return new Promise((resolve, reject) => {
			setTimeout(() => {
				uni.getBLEDeviceServices({
					deviceId,
					success: res => {
						for (let service of res.services) {
							if (service.isPrimary) {
								_serviceList.push(service);
							}
						}
						uni.hideLoading();
						console.log("_serviceList: " + JSON.stringify(_serviceList));
						resolve(_serviceList)
					},
					fail: err => {
						uni.hideLoading();
						self.showToast(`获取设备Services` + JSON.stringify(err));
						reject(err);
					},
				})
			}, 500);
		});
	}

	//获取蓝牙设备某个服务中所有特征值(characteristic)
	getBLEDeviceCharacteristics() {
		let deviceId = this.get_deviceId();
		let serviceId = this.get_serviceId();

		let self = this;
		return new Promise((resolve, reject) => {
			uni.getBLEDeviceCharacteristics({
				deviceId,
				serviceId,
				success: res => {
					for (let _obj of res.characteristics) {
						//获取notify
						if (_obj.properties.notify) {
							self.set_notifyId(_obj.uuid);
						}
						//获取writeId
						if (_obj.properties.write) {
							self.set_writeId(_obj.uuid);
						}
					}

					//console.log("res:getBLEDeviceCharacteristics " + JSON.stringify(res));
					let result = {
						'notifyId': self.notifyId,
						'writeId': self.writeId
					};
					self.showToast(`获取服务中所有特征值OK,${JSON.stringify(result)}`);
					resolve(result)
				},
				fail: err => {
					self.showToast(`getBLEDeviceCharacteristics` + JSON.stringify(err));
					reject(err);
				}
			})
		});
	}

	//断开联链接
	closeBLEConnection() {
		let deviceId = this.deviceId;
		uni.closeBLEConnection({
			deviceId,
			success(res) {
				console.log(res)
			}
		})
	}

	notifyBLECharacteristicValue() {
		let deviceId = this.deviceId;
		let serviceId = this.serviceId;
		let characteristicId = this.notifyId;

		uni.notifyBLECharacteristicValueChange({
			state: true, // 启用 notify 功能
			deviceId,
			serviceId,
			characteristicId,
			success(res) {
				uni.onBLECharacteristicValueChange(function(res) {

				});
			},
			fail(res) {
				console.log('notifyBLECharacteristicValueChange failed:' + res.errMsg);

			}
		});
	}

	writeBLECharacteristicValue(buffer) {
		let deviceId = this.deviceId;
		let serviceId = this.serviceId;
		let characteristicId = this.writeId;

		console.log("this: " + JSON.stringify(this));

		return new Promise((resolve, reject) => {
			uni.writeBLECharacteristicValue({
				deviceId,
				serviceId,
				characteristicId,
				value: buffer,
				success(res) {
					console.log('message发送成功', JSON.stringify(res));
					resolve(res);
				},
				fail(err) {
					console.log('message发送失败', JSON.stringify(err));
					reject(err);
				}
			});
		});
	}

	closeBluetoothAdapter() {
		uni.closeBluetoothAdapter({
			success: res => {
				console.log(res)
			}
		});
	}

	//若APP在之前已有搜索过某个蓝牙设备，并成功建立连接，可直接传入之前搜索获取的 deviceId 直接尝试连接该设备，无需进行搜索操作。
	reconnect() {
		(async () => {
			try {

				let result1 = await this.createBLEConnection();
				console.log("createBLEConnection: " + JSON.stringify(result1));

				let result2 = await this.getBLEDeviceServices();
				console.log("getBLEDeviceServices: " + JSON.stringify(result2));

				let result3 = await this.getBLEDeviceCharacteristics();
				console.log("getBLEDeviceCharacteristics: " + JSON.stringify(result3));

			} catch (err) {
				console.log("err: " + JSON.stringify(err));
			}

		})();
	}
}

export default Bluetooth;
