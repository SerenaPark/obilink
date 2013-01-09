var express=require('express');
var app=express();
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var qs = require('querystring');
var musicmetadata = require('musicmetadata');
var confxmlPath = __dirname + "/../../conf.xml";
var videoFileExt = [".avi", ".mp4"];
var audioFileExt = [".mp3"];

// function isInArray(ext, arr){
// 	return arr.indexOf(ext) < 0 ? false: true;
// }

// function getFileList(dir, fileExt){
// 	try {
// 		var targetPath = path.join(__dirname + "/" + dir);
// 		var items = fs.readdirSync(targetPath);
// 		var rtn = [];
// 		if (items.length > 0){
// 			for(var i=0; i<items.length; i++) {
// 				var item = items[i];
// 				var filepath = path.join(dir + "/" + item);
// 				if(isInArray(path.extname(item), fileExt)){
// 					var rtnItem = {
// 						"filewebpath": filepath,
// 						"filename": item
// 					};
// 					rtn.push(rtnItem);
// 				}
// 			}
// 		}
// 		return rtn;
// 	}
// 	catch (err){
// 		console.log("getFileList error");
// 	}
// }

app.configure( function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
  	secret: "secret",
  	store: new express.session.MemoryStore
  }));
  app.use(express.static(__dirname + '/web'));
  app.use(express.directory(__dirname + '/web'));
  app.use(app.router);
  app.use(express.logger('dev'));
});

app.get('/', function(req, res){
	console.log(req);
});

function getList(dir, fileTypeExts, type){
	try {
		var items = fs.readdirSync(path.join(__dirname + "/" + dir));
		var rtn = [];
		var filepath;
		var rtnItem = {};
		if (items.length > 0){
			for(var i=0; i<items.length; i++) {
				filepath = path.join(dir + "/" + items[i]);
				var extname = path.extname(items[i]);
				//if ( (extname.indexOf([".avi", ".mp4"])) < 0 ? false : true){
				if ( fileTypeExts.indexOf(extname) >= 0 ){
					rtnItem = { "path": filepath, "name": items[i], "type": type };
					rtn.push(rtnItem);
				}
			}
		}
		return rtn;
	}
	catch (err){
		console.log("getList error");
		return null;
	}
}

function comp(a, b){
 	if (a.name < b.name)
    	return -1;
  	if (a.name > b.name)
    	return 1;
  	return 0;
}

app.get('/getVideoList', function(req,res){
	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse	        
	    	for(var i=0; i<result.shareddir.contents.length; i++){
	        	rtn = rtn.concat( getList( String(result.shareddir.contents[i].lnpath), videoFileExt, "v") );
	    	}
		    var returnJson = JSON.stringify(rtn.sort(comp));
		    if(returnJson.length > 0)
		    	res.end(returnJson);
	    });
	});
});

app.get('/getAudioList', function(req,res){
	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse	        
	    	for(var i=0; i<result.shareddir.contents.length; i++){
	        	rtn = rtn.concat( getList( String(result.shareddir.contents[i].lnpath), audioFileExt, "a") );
	    	}
  		    var returnJson = JSON.stringify(rtn.sort(comp));
		    if(returnJson.length > 0)
		    	res.end(returnJson);
	    });
	});
});

app.post('/getAudioThumbnail', function(req, res){
	var reqAudioPath = req.body.filepath;
	if(reqAudioPath){
		var parser = new musicmetadata(fs.createReadStream(__dirname + "/" + reqAudioPath));		
		parser.on('metadata', function(result) {
   			if(result.picture){
   				fs.writeFile('test.jpg', result.picture.data);
   				// var item = new Object();
   				// item.title = result.title;
   				// item.picture = result.picture.toString('base64');
   				// res.end(JSON.stringify(item));
   			}
 		});
	}
});

app.get('/getDropboxList', function(req,res){
	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse
	    	var vlist = getList( String(result.shareddir.dropbox[0].lnpath), videoFileExt, "v" );	    	
	    	var alist = getList( String(result.shareddir.dropbox[0].lnpath), audioFileExt, "a" );
	    	vlist.sort(comp);
	    	alist.sort(comp);

	    	var returnJson = JSON.stringify(vlist.concat(alist));
		    if(returnJson.length > 0)
		    	res.end(returnJson);
	    });
	});
});

console.log('Express server start');

app.listen(8888);