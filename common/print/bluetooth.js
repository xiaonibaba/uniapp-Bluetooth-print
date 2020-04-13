class Bluetooth {

	constructor() {
		this.isOpenBle = false;
		this.deviceId = "";
		this.serviceId = "";
		this.writeId = "";
		this.notifyId = "";
		this.openBluetoothAdapter();
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
		let self = this;
		return new Promise((resolve, reject) => {
			uni.stopBluetoothDevicesDiscovery({
				success: e => {
					uni.hideLoading();
				},
				fail: e => {
					uni.hideLoading();
					self.showToast(`停止搜索蓝牙设备失败` + JSON.stringify(err));
				}
			})
		});
	}

	createBLEConnection() {
		//设备deviceId
		let deviceId = this.deviceId;
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
		let deviceId = this.deviceId;
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
		let deviceId = this.deviceId;
		let serviceId = this.serviceId;

		let self = this;
		return new Promise((resolve, reject) => {
			uni.getBLEDeviceCharacteristics({
				deviceId,
				serviceId,
				success: res => {
					for (let _obj of res.characteristics) {
						//获取notify
						if (_obj.properties.notify) {
							self.notifyId = _obj.uuid;
							uni.setStorageSync('notifyId', self.notifyId);
						}
						//获取writeId
						if (_obj.properties.write) {
							self.writeId = _obj.uuid;
							uni.setStorageSync('writeId', self.writeId);
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

		uni.writeBLECharacteristicValue({
			deviceId,
			serviceId,
			characteristicId,
			value: buffer,
			success(res) {
				console.log('message发送成功', JSON.stringify(res));
			},
			fail(err) {
				console.log('message发送失败', JSON.stringify(err));
			}
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
				this.deviceId = this.deviceId || uni.getStorageSync("deviceId");
				this.serviceId = this.serviceId || uni.getStorageSync("serviceId");

				let result1 = await this.createBLEConnection();
				console.log("createBLEConnection: " + JSON.stringify(result1));

				let result2 = await this.getBLEDeviceServices();
				console.log("getBLEDeviceServices: " + JSON.stringify(result2));

				let result3 = await this.getBLEDeviceCharacteristics();
				console.log("getBLEDeviceCharacteristics: " + JSON.stringify(result3));

				this.writeId = uni.getStorageSync("writeId");
				this.notifyId = uni.getStorageSync("notifyId");
			} catch (err) {
				console.log("err: " + JSON.stringify(err));
			}

		})();
	}
}

export default Bluetooth;
