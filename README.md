#功能说明
+ 打印文字
+ 打印对齐
+ 打印二维码
+ 2020/04/22 增加文字+二维码示例,更新请查看[github](https://github.com/xiaonibaba/uniapp-Bluetooth-print)

#问题排查
- 确定手机蓝牙打开,允许微信访问蓝牙的权限
- 微信要允许访问蓝牙和位置信息
- 重启蓝牙设备(打印机)
- 不行的时候,删掉手机中蓝牙设备(打印机),重新链接 

#参考		
+ [Uni-App使用低功耗蓝牙连接血压仪测量](https://blog.csdn.net/msy_msy/article/details/94015449)
+ [微信 小程序 蓝牙 打印 小票 二维码](https://gitee.com/copperpeas/wx-bluetooth/)
+ [小程序蓝牙打印](https://github.com/benioZhang/miniprogram-bluetoothprinter)
+ [二维码宽度定义](https://blog.csdn.net/cfujiC/article/details/86013122)
> + 我的图片宽度是240，那么拼接的指令就是[29, 118, 48, 0, 30, 0, 240, 0]
> + 我的图片宽度是160，那么拼接的指令就是[29, 118, 48, 0, 20, 0, 160, 0]
> + 补充一点，打印非二维码的图片，宽度一定要是24的倍数，不然打印也会出现乱码