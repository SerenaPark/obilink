var express=require('express');
var app=express();
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var musicmetadata = require('musicmetadata');
var confxmlPath = __dirname + "/../../conf.xml";
var videoFileExt = [".avi", ".mp4"];
var audioFileExt = [".mp3"];

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
	var reqAudioPath = req.body.path;
	var reqAudioId = req.body.selectedAudioId;

	if(reqAudioPath){
		var parser = new musicmetadata(fs.createReadStream(__dirname + "/" + reqAudioPath));		
		parser.on('metadata', function(result) {
   			if(result.picture){
   				var item = new Object();

				item.selectedAudioId = reqAudioId;

   				if(result.title.length > 0)
   					item.title = result.title;

   				if(result.picture.length > 0)
   					item.picture = result.picture[0].data.toString('base64');

   				res.end(JSON.stringify(item));
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