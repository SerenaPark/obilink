var express=require('express'), ffmpeg = require('fluent-ffmpeg');
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
  app.use(express.static(__dirname + '/contents'));
  app.use(express.directory(__dirname + '/web'));
  app.use(app.router);
  app.use(express.logger('dev'));
});

app.get('/', function(req, res){
	console.log(req);
});

function getList(dir, fileTypeExts, type, __vd__NameWithEndSlash){
	try {
		var items = fs.readdirSync(path.join(__dirname + "/contents/" + dir));
		var rtn = [];
		var filepath;
		var rtnItem = {};
		if (items.length > 0){
			for(var i=0; i<items.length; i++) {
				filepath = path.join(__vd__NameWithEndSlash + dir + "/" + items[i]);
				var extname = path.extname(items[i]);
				if ( fileTypeExts.indexOf(extname) >= 0 ){
					rtnItem = { "path": filepath.split("\\").join("/"), "name": items[i], "type": type };
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
	        	rtn = rtn.concat( getList( String(result.shareddir.contents[i].lnpath), videoFileExt, "v", "__vd__video/") );
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
	        	rtn = rtn.concat( getList( String(result.shareddir.contents[i].lnpath), audioFileExt, "a", "") );
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
		var parser = new musicmetadata(fs.createReadStream(__dirname + "/contents/" + reqAudioPath));		
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
	    	var vlist = getList( String(result.shareddir.dropbox[0].lnpath), videoFileExt, "v", "" );	    	
	    	var alist = getList( String(result.shareddir.dropbox[0].lnpath), audioFileExt, "a", "" );
	    	vlist.sort(comp);
	    	alist.sort(comp);

	    	var returnJson = JSON.stringify(vlist.concat(alist));
		    if(returnJson.length > 0)
		    	res.end(returnJson);
	    });
	});
});

app.get('/__vd__video/*', function(req, res) {
	res.contentType('m3u8');
	// make sure you set the correct path to your video file storage
	var pathToMovie = __dirname + '/' + req.params[0]; 
	var proc = new ffmpeg({
	source: pathToMovie,  // input source, required
	timeout: 300*60, // timout of the spawned ffmpeg sub-processes in seconds (optional, defaults to 30)
	priority: 0,          // default priority for all ffmpeg sub-processes (optional, defaults to 0 which is no priorization)
	logger: null,        // set a custom [winston](https://github.com/flatiron/winston) logging instance (optional, default null which will cause fluent-ffmpeg to spawn a winston console logger)
	nolog: false        // completely disable logging (optional, defaults to false)
	})
	.toFormat('mpegts')
	.withVideoBitrate('480k')
	.withVideoCodec('libx264')
	.withSize('480x320')
	.withAudioBitrate('128k')
	.withAudioCodec('libmp3lame')
	.addOptions(['-bt 200k', '-subq 7', '-me_range 16', '-qcomp 0.6', '-qmin 10', '-qmax 51'])
	// save to stream
	.writeToStream(res, function(retcode, error){
		console.log( ' video file: ' + req.params[0] + ' has been converted succesfully');
	});
});

console.log('Express server start');

app.listen(8888);