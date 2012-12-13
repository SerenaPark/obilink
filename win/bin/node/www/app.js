var express=require('express');
var app=express();
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var confxmlPath = __dirname + "/../../conf.xml";
var videoFileExt = [".avi", ".mp4"];
var audioFileExt = [".mp3"];

function isInArray(ext, arr){
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
	catch(err){
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
  // app.use(express.session({
  // 	key: 'A_SESSION_KEY',
  // 	secret: 'SOMETHING_REALLY_HARD_TO_GUESS',
  // 	store: new express.session.MemoryStore
  // }));
  app.use(express.static(__dirname + ''));
  app.use(express.directory(__dirname + ''));
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
	        	rtn = rtn.concat(getFileList(String(result.shareddir.contents[i].lnpath), videoFileExt));
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

var Dropbox = require("./dropboxClient");
var client = new Dropbox;
var sessionStore = [];

app.get('/drop_autenticate', function(req, res){
	if(!isInArray(req.sessionID,sessionStore)){
		sessionStore.push(req.sessionID);
		client.authenticate(function(){
			res.redirect('/drop_getFileList');
			res.send('success');
		});
	}
	else{
		res.redirect('/drop_getFileList');
		res.send('success');
	}
});

app.get('/drop_getFileList(/*)?', function(req,res){
	client.getFileList();
	res.send('success');
});

console.log('Express server start');

app.listen(8888);