var express=require('express');
var app=express();
var fs = require('fs');
var path = require('path');
var tempVideoPath = "/contents/video";
var tempAudioPath = "/contents/audio";

function getFileList(dir, fileExt){
	var targetPath = path.join(__dirname + dir);
	var items = fs.readdirSync(targetPath);
	var rtn = [];
	if(items.length > 0){
		for(var i=0; i<items.length; i++){
			var item = items[i];
			var filepath = path.join(dir + "/" + item);
			if(path.extname(item) == fileExt){
				var rtnItem = {
					"filewebpath": filepath,
					"filename": item
				};
				rtn.push(rtnItem);
			}
		}
	}
	return JSON.stringify(rtn);	
}

app.configure( function(){
  app.use(express.methodOverride());
  app.use(express.static(__dirname+ ''));
  app.use(app.router);
});

app.get(/getVideoList/, function(req,res){
	var resultJson = getFileList(tempVideoPath, ".avi");
	console.log(resultJson);
	if(resultJson.length != 0)
		res.end(resultJson);
});

app.get(/getAudioList/, function(req,res){
	var resultJson = getFileList(tempAudioPath, ".mp3");
	console.log(resultJson);
	if(resultJson.length != 0)
		res.end(resultJson);
});

console.log('Express server start');

app.listen(8888);