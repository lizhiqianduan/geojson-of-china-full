var http = require('http');
var https = require('https');
var fs = require('fs');


// 是否更新带子级的数据+区域数据，默认不带子级+区域数据
var isFull = process.argv.slice(-1)[0]==="full";

// 是否仅仅只更新区域
var justArea = process.argv.slice(-1)[0]==="area";

console.log(isFull);
// 获取行政区域ID
logLog('1、获取行政区域列表...');
httpsGet("https://geo.datav.aliyun.com/areas_v2/bound/all.json",function (err, data) {
	if(err) return logError('获取行政区域失败！',err);
	writeFile('area',data);
	logLog('1、获取行政区域列表成功！','area');
	
	var list = JSON.parse(data);
	logLog('2、开始获取区域信息...');
	getAreaData(list);
	logLog('2、获取区域信息成功！');
	if(justArea) return logLog("全部执行完毕！请前往data目录查看！");



	// 拼装GeoJSON的url
	var geoJsonUrls = list.map(function(item){
		if(item.level!=="district")
			return {item:item,url:"https://geo.datav.aliyun.com/areas_v2/bound/"+item.adcode+(isFull?"_full":"")+".json"};
		return {item:item};
	});

	// 判断是否只更新区域
	if(justArea) geoJsonUrls = [];
	logLog('需获取的总GeoJson数量：'+geoJsonUrls.length);
	

	// 获取GeoJSON
	httpsGetList(geoJsonUrls,function (err,data,index,area){
		var areaName = area.item.name;
		if(err) return logError(index,areaName,'获取GeoJSON失败！',err.message);
		logLog(index,areaName,'获取GeoJSON成功！');

		var filename = area.item.adcode+"_geojson"+(isFull?"_full":"");
		writeFile(filename,data);
		logLog(index,areaName,'写入成功！',filename);
	},()=>{
		logLog("全部执行完毕！请前往data目录查看！");
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
	
	// 判断长度
	if(urlObjList&&urlObjList.length===0) return endCb&&endCb();
	
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

/**
 * 从全量数据中获取各个省、市的子区域
 */
function getAreaData(list){
	list.forEach(function(item,index){
		var adcode = item.adcode;
		var areaName = item.name;

		// 过滤区县级
		if(item.level==='district') return logError(index,areaName,'县级地区忽略！');

		// 写入文件的内容
		var res = {rows:[],total:0};
		list.forEach(function(element){
			if(element.parent===adcode){
				res.rows.push(element);
			}
		});
		res.total = res.rows.length;
		var filename = adcode+"_area";
		writeFile(filename,JSON.stringify(res));
		logLog(index,areaName,'写入成功！',filename);
	});
}
