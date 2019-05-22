var http = require('http');
var https = require('https');
var fs = require('fs');

var isFull = process.argv.slice(-1)[0]==="full";
console.log(isFull);
// 获取行政区域ID
logLog('1、获取行政区域列表...');
httpsGet("https://datav.aliyun.com/tools/atlas/data/all.json",function (err, data) {
	if(err) return logError('获取行政区域失败！',err);
	writeFile('area',data);
	logLog('1、获取行政区域列表成功！','area');
	
	var list = JSON.parse(data);



	// 拼装GeoJSON的url
	var geoJsonUrls = list.map(function(item){
		if(item.level!=="district")
			return {item:item,url:"https://geo.datav.aliyun.com/areas/bound/"+item.adcode+(isFull?"_full":"")+".json"};
		return {item:item};
	});

	// 拼装地区的url
	var areaUrls = list.map(function(item){
		var level = ['country','province','city','district'];
		var index = level.indexOf(item.level);
		if(index<3)
			return {item:item,url:"https://geo.datav.aliyun.com/areas/csv/510000_"+(level[index+1])+".json"};
		return {item:item};
	});


	// 获取GeoJSON
	httpsGetList(geoJsonUrls,function (err,data,index,area){
		var areaName = area.item.name;
		if(err) return logError(index,areaName,'获取GeoJSON失败！',err.message);
		logLog(index,areaName,'获取GeoJSON成功！');

		var filename = area.item.adcode+"_geojson"+(isFull?"_full":"");
		writeFile(filename,data);
		logLog(index,areaName,'写入成功！',filename);
	},()=>{

		// 获取地区json
		httpsGetList(areaUrls,function (err,data,index,area){
			var areaName = area.item.name;
			if(err) return logError(index,areaName,'获取area失败！',err.message);
			logLog(index,areaName,'获取area成功！');

			var filename = area.item.adcode+"_area";
			writeFile(filename,data);
			logLog(index,areaName,'写入成功！',filename);
		});

	});

	

});



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
	Array.prototype.push.call(arguments,'\033[0m');
	Array.prototype.unshift.call(arguments,'\033[;31m =>');
	console.log.apply(this,arguments);
}


// 'https://geo.datav.aliyun.com/areas/bound/100000.json'

function httpsGet(url,cb) {
	if(!url) return cb({message:"url为空"});

	https.get(url,function (res) {
		if(res.statusCode!==200) return cb({message:"状态不等于200！"});
		res.setTimeout(5000);
		res.setEncoding('utf8');
		var rawData = '';
		res.on('data', function(chunk){ rawData += chunk; });
		res.on('end', function(){
			cb(null,rawData);
		});
	}).on('error', function(e){
		cb(e);
	});
}

function httpsGetList(urlObjList,progressCb,endCb,index){
	index = index ||0;

	// 县级地区忽略
	if(urlObjList[index].item.level=='district'){
		progressCb&&progressCb({message:"县级地区忽略！"},null,index,urlObjList[index]);
		++index;
		// 判断结尾
		if(index===urlObjList.length-1) {
			return endCb&&endCb();
		}
		httpsGetList(urlObjList,progressCb,endCb,index);
		return;
	}


	httpsGet(urlObjList[index].url,(err,data)=>{
		progressCb&&progressCb(err,data,index,urlObjList[index]);
		++index;
		// 判断结尾
		if(index===urlObjList.length-1) {
			return endCb&&endCb();
		}
		httpsGetList(urlObjList,progressCb,endCb,index);
	});
}