var http = require('http');
var https = require('https');
var fs = require('fs');

// 获取行政区域ID
logLog('1、获取行政区域列表...');
httpsGet("https://datav.aliyun.com/tools/atlas/data/all.json",function (err, data) {
	if(err) return logError('获取行政区域失败！',err);
	
	writeFile('area',data);
	
	logLog('1、获取行政区域列表成功！');
	
	var list = JSON.parse(data);
	getListItemRecursion(list,0,function (err, data,item,index) {
		writeFile(item.adcode,data);
		logLog('下标：',index,'名称：',item.name,"ID：",item.adcode,"写入成功！");
	},function () {
	
	});
});

/**
 * 递归获取json
 * @param list
 * @param index
 * @param progressCb
 * @param endCb
 */
function getListItemRecursion(list,index,progressCb,endCb) {
	if(index===list.length-1) return endCb();
	httpsGet("https://geo.datav.aliyun.com/areas/bound/"+list[index].adcode+"_full.json",function (err, data) {
		progressCb && progressCb(err,data,list[index],index);
		setTimeout(function () {
			getListItemRecursion(list,++index,progressCb,endCb);
		},100);
	});
}

function writeFile(filename, strData) {
	var fd = fs.openSync('./data/'+filename+'.json','w+');
	fs.writeFileSync(fd,strData);
	fs.closeSync(fd);
}
function logLog(log){
	Array.prototype.push.call(arguments,'\033[0m');
	Array.prototype.unshift.call(arguments,'\033[;32m =>');
	console.log.apply(this,arguments);
}

function logError(log){
	console.log('\033[;31m','=>',log,'\033[0m')
}


// 'https://geo.datav.aliyun.com/areas/bound/100000.json'

function httpsGet(url,cb) {
	https.get(url,function (res) {
		res.setEncoding('utf8');
		var rawData = '';
		res.on('data', function(chunk){ rawData += chunk; });
		res.on('end', function(){
			cb(null,rawData);
		});
	});
}