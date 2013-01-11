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

function isInArray(ext, arr){
	return arr.indexOf(ext) < 0 ? false: true;
}

function getFileList(dir, fileExt){
	try {
		var targetPath = path.join(__dirname + "/" + dir);
		var items = fs.readdirSync(targetPath);
		var rtn = [];
		if (items.length > 0){
			for(var i=0; i<items.length; i++) {
				var item = items[i];
				var filepath = path.join(dir + "/" + item);
				if(isInArray(path.extname(item), fileExt)){
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
	catch (err){
		console.log("getFileList error");
	}
}

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

app.get('/getVideoList', function(req,res){
	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse	        
	    	for(var i=0; i<result.shareddir.contents.length; i++){
	        	rtn = rtn.concat( getFileList( String(result.shareddir.contents[i].lnpath), videoFileExt) );
	    	}
	    });
	    var returnJson = JSON.stringify(rtn);
	    if(returnJson.length > 0)
	    	res.end(returnJson);
	});
});

app.get('/getAudioList', function(req,res){
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
	    	var ext = videoFileExt.concat(audioFileExt);
	    	rtn = rtn.concat(getFileList(String(result.shareddir.dropbox[0].lnpath), ext));
	    });
	    var returnJson = JSON.stringify(rtn);
	    if(returnJson.length > 0)
	    	res.end(returnJson);
	});
});

app.get('/*getAccessURL', function(req, res){
	var net = require('net');
	function getNetworkIP(callback) {
	  var socket = net.createConnection(80, 'www.google.com');
	  socket.on('connect', function() {
	    callback(undefined, socket.address().address);
	    socket.end();
	  });
	  socket.on('error', function(e) {
	    callback(e, 'error');
	  });
	}
	getNetworkIP(function (error, ip) {
	    if (error) {
	        console.log('error:', error);
	    }
	    res.end("http://" + ip + ":8888/index.html");
	});
});

console.log('Express server start');

app.listen(8888);