const formatTime = date => {
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()
	const hour = date.getHours()
	const minute = date.getMinutes()
	const second = date.getSeconds()

	return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
	n = n.toString()
	return n[1] ? n : '0' + n
}


//4合1 
function convert4to1(res) {
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
}

//8合1
function convert8to1(arr) {
	let data = [];
	for (let k = 0; k < arr.length; k += 8) {
		let temp = arr[k] * 128 + arr[k + 1] * 64 + arr[k + 2] * 32 + arr[k + 3] * 16 + arr[k + 4] * 8 + arr[k + 5] * 4 +
			arr[k + 6] * 2 + arr[k + 7] * 1
		data.push(temp);
	}
	return data;
}

//我的图片宽度是240，那么拼接的指令就是[29, 118, 48, 0, 30, 0, 240, 0]
//我的图片宽度是160，那么拼接的指令就是[29, 118, 48, 0, 20, 0, 160, 0]
//补充一点，打印非二维码的图片，宽度一定要是24的倍数，不然打印也会出现乱码
function toArrayBuffer(res) {
	let arr = convert4to1(res.data);
	let data = convert8to1(arr);
	let cmds = [].concat([27, 97, 1], [29, 118, 48, 0, 30, 0, 240, 0], data, [27, 74, 3], [27, 64]);
	return new Uint8Array(cmds).buffer;
}

function zip_image(res) {
	let arr = convert4to1(res.data);
	let data = convert8to1(arr);
	return data;
}

module.exports = {
	formatTime: formatTime,
	toArrayBuffer: toArrayBuffer,
	zip_image: zip_image,
}
