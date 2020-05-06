<template>
	<!-- 
	1.手机蓝牙打开
	2.微信也许访问蓝牙和位置信息
	3.重启蓝牙设备
	4.不行的时候,删掉手机中蓝牙,重新链接 
	-->
	<view>
		<view>
			<button size="mini" type="primary" @tap="startBluetoothDeviceDiscovery">搜索周边设备</button>
			<button size="mini" type="warn" @tap="stopBluetoothDevicesDiscovery">停止搜索</button>
			<button type="primary" @tap="pickUpOnce">测试打印</button>
		</view>
		<view style="font-size: 24rpx; color: #333;margin-left: 10rpx;">连接设别:{{bluetooth.get_deviceId()}}</view>
		<scroll-view class="device_list" scroll-y show-scrollbar>
			<radio-group>
				<view v-for="(item,index) in devicesList" :key="index" class="device_item" v-if="item.name.length>0">
					<view style="font-size: 32rpx; color: #333;">
						<radio :value="item.deviceId" @tap="select_deviceId(item)" />{{item.name }}</view>
					<view style="font-size: 20rpx">信号强度: {{item.RSSI}}dBm ({{Math.max(100+item.RSSI,0)}}%)</view>
					<view style="font-size: 20rpx">deviceId: {{item.deviceId}}</view>
					<view style="font-size: 20rpx">Service数量: {{item.advertisServiceUUIDs.length || 0}}</view>

					<radio-group v-if="item.deviceId===deviceId">
						<view v-for="(service,service_index) in serviceList" :key="service_index" style="font-size: 20rpx">
							<radio style="transform:scale(0.7)" :value="service.uuid" @tap="select_service(service)" />{{service.uuid }}
						</view>
					</radio-group>
				</view>
			</radio-group>
		</scroll-view>
		<canvas canvas-id="shareCanvas" :style="{width:canvas_width+'px', height: canvas_height+'px'}"></canvas>
	</view>
</template>

<script>
	import PrinterJobs from '@/common/print/printerjobs.js'
	import printerUtil from '@/common/print/printerutil.js'
	import util from '@/common/print/util.js'
	import drawQrcode from '@/common/print/weapp.qrcode.esm.js'
	import Bluetooth from '@/common/print/bluetooth.js'

	export default {
		components: {},
		data() {
			return {
				isOpenBle: false, //是否已经打开蓝牙，默认为false
				devicesList: [], //设备列表
				serviceList: [], //服务列表
				deviceId: "", //选中的deviceId
				canvas_width: 240,
				canvas_height: 240,
				bluetooth: new Bluetooth(),
			}
		},
		//页面卸载是关闭蓝牙链接
		onUnload() {
			this.bluetooth.closeBLEConnection();
			this.bluetooth.closeBluetoothAdapter();
		},
		//页面打开,获取位置,打开蓝牙链接
		onLoad() {
			uni.getLocation({
				type: 'wgs84',
				success: function(res) {
					console.log('当前位置的经度：' + res.longitude);
					console.log('当前位置的纬度：' + res.latitude);
				}
			});

			this.bluetooth.openBluetoothAdapter();

		},
		methods: {
			//1.搜索周边设备
			startBluetoothDeviceDiscovery() {
				uni.showLoading({
					title: '蓝牙搜索中'
				})

				let self = this;
				self.devicesList = [];

				setTimeout(() => {
					uni.startBluetoothDevicesDiscovery({
						success: res => {
							uni.onBluetoothDeviceFound(devices => {
								console.log("发现设备: " + JSON.stringify(devices));
								let obj = devices.devices[0];

								//obj不重复,就添加到devicesList中,
								if (!self.devicesList.some(item => {
										return item.deviceId === obj.deviceId
									})) {
									self.devicesList.push(obj)
								}
							});
						},
						fail: err => {
							uni.hideLoading();
							self.showToast(`搜索设备失败` + JSON.stringify(err));
						}
					})
				}, 200)
			},

			//2.停止搜索蓝牙设备
			async stopBluetoothDevicesDiscovery() {
				let obj = await this.bluetooth.stopBluetoothDevicesDiscovery();
				uni.hideLoading();
			},


			//3.测试打印
			pickUpOnce() {
				this.bluetooth.notifyBLECharacteristicValue();
				let self = this;
				setTimeout(() => {
					self.writeBLECharacteristicValue();
				}, 500);
			},

			//选中设备
			async select_deviceId(item) {
				this.deviceId = item.deviceId;
				this.bluetooth.set_deviceId(item.deviceId);
				this.serviceList = [];

				try {
					//1.链接设备
					let result = await this.bluetooth.createBLEConnection();
					//2.寻找服务
					let result2 = await this.bluetooth.getBLEDeviceServices();

					console.log("获取服务: " + JSON.stringify(result2));

					this.serviceList = result2;
				} catch (e) {
					//TODO handle the exception
					console.log("e: " + JSON.stringify(e));
				}
			},

			//选中服务
			async select_service(res) {
				this.bluetooth.set_serviceId(res.uuid);
				let result = await this.bluetooth.getBLEDeviceCharacteristics();
			},


			//写入控制命令
			async writeBLECharacteristicValue() {

				let Qrcode_res = await this.get_Qrcode();

				console.log(Qrcode_res);

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
					.printQrcode(Qrcode_res)
					.println()

				;
				//console.log(printerJobs);

				let buffer = printerJobs.buffer();

				this.printbuffs(buffer);
			},

			//循环发送数据
			printbuffs(buffer) {
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

			//向打印机发送数据
			printbuff(buffer) {
				this.bluetooth.writeBLECharacteristicValue(buffer);
			},

			//生成二维码
			get_Qrcode() {
				let self = this;
				return new Promise((resolve, reject) => {
					const ctx = uni.createCanvasContext('shareCanvas');
					console.log(self.canvas_width);
					ctx.clearRect(0, 0, self.canvas_width, self.canvas_height);

					drawQrcode({
						canvasId: 'shareCanvas',
						text: String('xiaonibaba.com'),
						width: self.canvas_width,
						height: self.canvas_height,
						callback(e) {
							setTimeout(() => {
								console.log(self.canvas_width);
								// 获取图片数据
								uni.canvasGetImageData({
									canvasId: 'shareCanvas',
									x: 0,
									y: 0,
									width: self.canvas_width,
									height: self.canvas_height,
									success(res) {
										resolve(util.zip_image(res));
									}
								})
							}, 1000);
						}
					});
				});
			},

		}
	}
</script>

<style>
	button {
		margin: 10rpx;
	}

	.device_list {
		margin: 0 10rpx;
		border: 1rpx solid #ddd;
		border-radius: 10rpx;
		background-color: #FdFdFd;
		top: 250rpx;
		bottom: 10rpx;
		position: absolute;
		width: 730rpx;
	}

	.device_item {
		border-bottom: 1rpx solid #ddd;
		padding: 20rpx;
		color: #666;
		background-color: #C0C0C0;

	}

	/*二维码隐藏到窗口外*/
	canvas {
		position: absolute;
		top: -999rpx
	}
</style>
