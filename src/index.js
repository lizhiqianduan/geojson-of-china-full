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
	
	getData(list,isFull,function (errorItems2) {
		logLog('3、开始获取带子级的GeoJSON获取完成！');
		
		logLog('全部完成！获取结果如下：');
		if(errorItems2.length===0) return logLog('全部获取成功！');
		
		if(errorItems2.length>0){
			logError('带子级存在失败的数据：');
			errorItems2.forEach(function (t) {
				logError(t.index,t.adcode,t.name,t.err?t.err.message:'');
			})
		}
		
		/*logLog('=============================');
		logLog('4、尝试重新获取失败的数据...');
		errorItems2.forEach(function (t) {
			getData(list.slice(t.index,t.index+1),false,function (errorItems2) {
				if(errorItems2.length===0) return logLog(t.index,'尝试成功！');
				else return logError(t.index,'尝试仍然失败！需手动获取！');
			});
		});*/
	});
});

function getData(list,isFull,endCb) {
	var errorItems = [];
	getListItemRecursion(list,0,isFull,function (err, data,item,index) {
		if(err) {
			errorItems.push({index:index,name:item.name,adcode:item.adcode,err:err});
			return logError('下标：',index,"ID：",item.adcode,item.name,"获取失败！");
		}
		try{
			var filename = item.adcode+(isFull?"_full":"");
			writeFile(filename,data);
			logLog('下标：',index,"filename：",filename,item.name,"写入成功！");
		}catch (e){
			errorItems.push({index:index,name:item.name,adcode:item.adcode,err:e});
			return logError('下标：',index,"ID：",item.adcode,item.name,"写入失败！");
		}
	},function () {
		endCb(errorItems);
	});
	
}

/**
 * 递归获取json
 * @param list
 * @param index
 * @param hasChildren 是否包含子级
 * @param progressCb
 * @param endCb
 */
function getListItemRecursion(list,index,hasChildren,progressCb,endCb) {
	if(index===list.length-1) return endCb();
	httpsGet("https://geo.datav.aliyun.com/areas/bound/"+list[index].adcode+(hasChildren?"_full":"")+".json",function (err, data) {
		progressCb && progressCb(err,data,list[index],index);
		setTimeout(function () {
			getListItemRecursion(list,++index,hasChildren,progressCb,endCb);
		},20);
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
	Array.prototype.push.call(arguments,'\033[0m');
	Array.prototype.unshift.call(arguments,'\033[;31m =>');
	console.log.apply(this,arguments);
}


// 'https://geo.datav.aliyun.com/areas/bound/100000.json'

function httpsGet(url,cb) {
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