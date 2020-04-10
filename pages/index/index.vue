<template>
	<!-- 
	1.手机蓝牙打开
	2.微信也许访问蓝牙和位置信息
	3.重启蓝牙设备
	4.不行的时候,删掉手机中蓝牙,重新链接 
	-->
	<view class="content">

		<button size="mini" type="primary" @tap="startBluetoothDeviceDiscovery" :loading="loading_1" :disabled="loading_1">搜索周边设备</button>
		<button size="mini" type="warn" @tap="stopBluetoothDevicesDiscovery">停止搜索</button>

		<!-- <button type="primary" @tap="createBLEConnection">链接打印机{{deviceId}}</button> -->
		<!-- <button type="warn" @tap="closeBluetoothAdapter">断开</button> -->
		<button type="primary" @tap="pickUpOnce">测试打印</button>
		<button type="primary" @tap="print_Qrcode">二维码</button>
		<button size="mini" type="primary" @tap="restart">重连</button>

		<button size="mini" type="primary" @tap="openBluetoothAdapter">打开</button>
		<button size="mini" type="primary" @tap="closeBluetoothAdapter">关闭</button>

		<!-- <button size="mini" class="mini-btn" :type="mini_type === '设备'?'primary':'default'" @tap="mini_type = '设备'">设备信息</button>
		<button size="mini" class="mini-btn" :type="mini_type === '设备'?'default':'primary'" @tap="mini_type = '日志'">日志</button>
 -->
		<view class="devices_summary">已发现 {{devicesList.length}} 个外围设备：{{device_info}}</view>
		<scroll-view class="device_list" scroll-y="true" show-scrollbar="true">
			<radio-group>

				<view v-for="(item,index) in devicesList" :key="index" class="device_item" v-if="item.name.length>0">
					<view style="font-size: 32rpx; color: #333;">
						<radio :value="item.deviceId" @tap="select_deviceId(item)" />{{item.name }}</view>
					<view style="font-size: 20rpx">信号强度: {{item.RSSI}}dBm ({{Math.max(100+item.RSSI,0)}}%)</view>
					<view style="font-size: 20rpx">deviceId: {{item.deviceId}}</view>
					<view style="font-size: 20rpx">Service数量: {{item.advertisServiceUUIDs.length || 0}}</view>

					<radio-group v-if="deviceId===item.deviceId">
						<view v-for="(res,i) in serviceList" :key="i" style="font-size: 20rpx">
							<radio style="transform:scale(0.7)" :value="res.uuid" @tap="select_service(res)" />{{res.uuid }}

						</view>
					</radio-group>

				</view>
			</radio-group>
		</scroll-view>

		<view class="devices_summary">Log：</view>
		<scroll-view class="device_list" scroll-y="true" show-scrollbar="true">
			<view v-for="(item,index) in BleMessge" :key="index" style="font-size: 20rpx" class="device_item">
				{{item.message}}
			</view>
		</scroll-view>

		<canvas style="width: 160px; height: 160px;" canvas-id="shareCanvas"></canvas>

	</view>
</template>

<script>
	import PrinterJobs from '@/common/print/printerjobs.js'
	import printerUtil from '@/common/print/printerutil.js'
	import util from '@/common/print/util.js'
	import drawQrcode from '@/common/print/weapp.qrcode.esm.js'
	import Bluetooth from '@/common/print/bluetooth.js'

	let obj = new Bluetooth();

	export default {
		components: {},
		data() {
			return {
				device_info: '',
				loading_1: false,
				//是否已经打开蓝牙，默认为false，当蓝牙适配器初始化成功后为true
				BleMessge: [],
				isOpenBle: false,
				//设备列表
				devicesList: [],
				serviceList: [],
				deviceId: "",
			}
		},
		onUnload() {
			obj.closeBLEConnection();
			obj.closeBluetoothAdapter();
		},

		onLoad() {

			uni.getLocation({
				type: 'wgs84',
				success: function(res) {
					console.log('当前位置的经度：' + res.longitude);
					console.log('当前位置的纬度：' + res.latitude);
				}
			});

		},
		methods: {

			openBluetoothAdapter() {
				uni.openBluetoothAdapter({
					success(res) {
						console.log(res)
					}
				});
			},

			closeBluetoothAdapter() {
				uni.closeBluetoothAdapter({
					success: res => {
						this.log('断开蓝牙模块成功');
					}
				});
			},


			async restart() {



			},

			async select_deviceId(item) {
				this.deviceId = item.deviceId;
				obj.deviceId = item.deviceId;
				uni.setStorageSync('deviceId', obj.deviceId);
				this.serviceList = [];

				this.device_info = `最后连接设别${item.name}`;

				uni.setStorageSync('device_info', this.device_info);

				try {
					//1.链接设备
					let result = await obj.createBLEConnection();
					//2.寻找服务
					let result2 = await obj.getBLEDeviceServices();
					this.serviceList = result2;
				} catch (e) {
					//TODO handle the exception
					console.log("e: " + JSON.stringify(e));
				}



			},

			async select_service(res) {

				obj.serviceId = res.uuid;
				uni.setStorageSync('serviceId', res.uuid);

				try {
					let result = await obj.getBLEDeviceCharacteristics();

					obj.writeId = uni.getStorageSync("writeId");
					obj.notifyId = uni.getStorageSync("notifyId");

				} catch (e) {
					//TODO handle the exception
					console.log("e: " + JSON.stringify(e));
				}

			},

			log(message) {
				console.log(message);
				this.BleMessge.unshift({
					message: message
				});
			},

			//打印一次
			pickUpOnce() {
				obj.notifyBLECharacteristicValue();
				let self = this;
				setTimeout(() => {
					self.writeBLECharacteristicValue();
				}, 500);
			},

			//搜索周边设备
			startBluetoothDeviceDiscovery() {
				uni.showLoading({
					title: '蓝牙搜索中'
				})

				let self = this;

				setTimeout(() => {
					uni.startBluetoothDevicesDiscovery({
						success: res => {
							uni.onBluetoothDeviceFound(devices => {
								//不重复,就添加到devicesList中,
								if (!this.devicesList.some(item => {
										return item.deviceId === devices.devices[0].deviceId
									})) {
									this.devicesList.push(devices.devices[0])
								}
							});
						},
						fail: res => {
							self.showToast(`搜索设备失败` + JSON.stringify(err));
						}
					})
				}, 200)
			},

			/**
			 * 停止搜索蓝牙设备
			 */
			stopBluetoothDevicesDiscovery() {
				obj.stopBluetoothDevicesDiscovery();
			},


			/**
			 * 写入控制命令
				
			 */
			writeBLECharacteristicValue() {

				let printerJobs = new PrinterJobs();
				printerJobs
					.print(util.formatTime(new Date()))
					.print(printerUtil.fillLine())
					.setAlign('ct')
					.setSize(2, 2)
					.print('#20外卖')
					.setSize(1, 1)
					.print('切尔西Chelsea')
					.setSize(2, 2)
					.print('在线支付(已支付)')
					.setSize(1, 1)
					.print('订单号：5415221202244734')
					.print('下单时间：' + util.formatTime(new Date()))
					.setAlign('lt')
					.print(printerUtil.fillAround('一号口袋'))
					.print(printerUtil.inline('意大利茄汁一面 * 1', '15'))
					.print(printerUtil.fillAround('其他'))
					.print('餐盒费：1')
					.print('[赠送康师傅冰红茶] * 1')
					.print(printerUtil.fillLine())
					.setAlign('rt')
					.print('原价：￥16')
					.print('总价：￥16')
					.setAlign('lt')
					.print(printerUtil.fillLine())
					.print('备注')
					.print("无")
					.print(printerUtil.fillLine())
					.println();

				let buffer = printerJobs.buffer();
				this.log('ArrayBuffer', 'length: ' + buffer.byteLength, ' hex: ' + printerUtil.ab2hex(buffer));
				// 1.并行调用多次会存在写失败的可能性
				// 2.建议每次写入不超过20字节
				// 分包处理，延时调用

				const maxChunk = 20;
				const delay = 20;
				for (let i = 0, j = 0, length = buffer.byteLength; i < length; i += maxChunk, j++) {
					let subPackage = buffer.slice(i, i + maxChunk <= length ? (i + maxChunk) : length);
					setTimeout(this.printbuff, j * delay, subPackage);
				}

			},

			printbuff(buffer) {
				console.log("obj: " + JSON.stringify(obj));
				obj.writeBLECharacteristicValue(buffer);
			},


			print_Qrcode() {
				let self = this;
				const ctx = uni.createCanvasContext('shareCanvas');
				ctx.clearRect(0, 0, 160, 160);
				console.log("0000000000")
				drawQrcode({
					canvasId: 'shareCanvas',
					text: String('xiaonibaba.com'),
					width: 160,
					height: 160,
					callback(e) {

						console.log("1111111111111111111")
						setTimeout(() => {
							// 获取图片数据
							uni.canvasGetImageData({
								canvasId: 'shareCanvas',
								x: 0,
								y: 0,
								width: 160,
								height: 160,
								success(res) {

									let buffer = self.toArrayBuffer(res);


									const maxChunk = 20;
									const delay = 20;
									for (let i = 0, j = 0, length = buffer.byteLength; i < length; i += maxChunk, j++) {
										let subPackage = buffer.slice(i, i + maxChunk <= length ? (i + maxChunk) : length);
										setTimeout(self.printbuff, j * delay, subPackage);
									}



								}
							})
						}, 3000);
					}
				});
			},

			//4合1 
			convert4to1(res) {
				let arr = [];
				for (let i = 0; i < res.length; i++) {
					if (i % 4 == 0) {
						let rule = 0.29900 * res[i] + 0.58700 * res[i + 1] + 0.11400 * res[i + 2];
						if (rule > 200) {
							res[i] = 0;
						} else {
							res[i] = 1;
						}
						arr.push(res[i]);
					}
				}
				return arr;
			},

			//8合1
			convert8to1(arr) {
				let data = [];
				for (let k = 0; k < arr.length; k += 8) {
					let temp = arr[k] * 128 + arr[k + 1] * 64 + arr[k + 2] * 32 + arr[k + 3] * 16 + arr[k + 4] * 8 + arr[k + 5] * 4 +
						arr[k + 6] * 2 + arr[k + 7] * 1
					data.push(temp);
				}
				return data;
			},


			toArrayBuffer(res) {
				let arr = this.convert4to1(res.data);
				let data = this.convert8to1(arr);
				let cmds = [].concat([27, 97, 1], [29, 118, 48, 0, 20, 0, 160, 0], data, [27, 74, 3], [27, 64]);
				return new Uint8Array(cmds).buffer;
			}

		}
	}
</script>

<style>
	.content {}

	page {
		color: #333;
	}

	button {
		margin: 10upx;
	}

	.devices_summary {
		margin-top: 5rpx;
		padding: 20rpx;
		font-size: 30rpx;
	}

	.device_list {
		margin: 5rpx 20rpx 5rpx 20rpx;
		border: 1rpx solid #ddd;
		border-radius: 10rpx;
		background-color: #FdFdFd;
		min-height: 0rpx;
		max-height: 400rpx;
		width: 700rpx;

	}

	.device_item {
		border-bottom: 1rpx solid #ddd;
		padding: 20rpx;
		color: #666;

	}

	.device_item_hover {
		background-color: rgba(0, 0, 0, .1);
	}

	.connected_info {
		position: fixed;
		bottom: 0;
		width: 100%;
		background-color: #F0F0F0;
		padding: 10px;
		padding-bottom: 20px;
		margin-bottom: env(safe-area-inset-bottom);
		font-size: 14px;
		min-height: 100px;
		box-shadow: 0px 0px 3px 0px;
	}

	.connected_info .operation {
		position: absolute;
		display: inline-block;
		right: 30px;
	}
</style>
