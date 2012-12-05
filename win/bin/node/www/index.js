var express=require('express');
var app=express();
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var confxmlPath = __dirname + "/../../conf.xml";
var videoFileExt = [".avi", ".mp4"];
var audioFileExt = [".mp3"];

function isFileExtInArray(ext, arr){
	return arr.indexOf(ext) < 0 ? false: true;
}

function getFileList(dir, fileExt){
	try{
		var targetPath = path.join(__dirname + "/" + dir);
		var items = fs.readdirSync(targetPath);
		var rtn = [];
		if(items.length > 0){
			for(var i=0; i<items.length; i++){
				var item = items[i];
				var filepath = path.join(dir + "/" + item);
				if(isFileExtInArray(path.extname(item), fileExt)){
					var rtnItem = {
						"filewebpath": filepath,
						"filename": item
					};
					rtn.push(rtnItem);
				}
			}
		}
		return rtn;
	}
	catch(err){
		console.log("getFileList error");
	}
}

app.configure( function(){
  app.use(express.methodOverride());
  app.use(express.static(__dirname+ ''));
  app.use(app.router);
});

app.get(/getVideoList/, function(req,res){
	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse	        
	    	for(var i=0; i<result.shareddir.contents.length; i++){
	        	rtn = rtn.concat(getFileList(String(result.shareddir.contents[i].lnpath), videoFileExt));
	    	}
	    });
	    var returnJson = JSON.stringify(rtn);
	    if(returnJson.length > 0)
	    	res.end(returnJson);
	});
});

app.get(/getAudioList/, function(req,res){
	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse	        
	    	for(var i=0; i<result.shareddir.contents.length; i++){
	        	rtn = rtn.concat(getFileList(String(result.shareddir.contents[i].lnpath), audioFileExt));
	    	}
	    });
	    var returnJson = JSON.stringify(rtn);
	    if(returnJson.length > 0)
	    	res.end(returnJson);
	});
	// var resultJson = getFileList(tempAudioPath, ".mp3");
	// //console.log(resultJson);
	// if(resultJson.length != 0)
	// 	res.end(resultJson);
});

console.log('Express server start');

app.listen(8888);