var express=require('express'), ffmpeg = require('fluent-ffmpeg');
var app=express();
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var musicmetadata = require('musicmetadata');
var confxmlPath = __dirname + "/../../conf.xml";
var videoFileExt = [".avi", ".mp4"];
var audioFileExt = [".mp3"];
var virtualDirectoryVideo = "__vd__video";
var videoCacheDir = "tmp-cache";

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
});

fs.mkdirRecursiveSync = function(directory, mode) {
	//Converting characters '/' to '\' in the directory path.
	var dirPath = directory.replace(/\//g, '\\');
	var parts = dirPath.split(/\\/gi);
	var tmpPath = parts[0];

	if(!fs.existsSync(tmpPath)) {
		fs.mkdirSync(tmpPath, mode);
	}

	for(i=1; i < parts.length; i++ ) {
		tmpPath = tmpPath + "\\" + parts[i];
		if(!fs.existsSync(tmpPath)) {
			fs.mkdirSync(tmpPath, mode);
		}
	}
};

function getThumbURL(name, type){
	var thumbURL;
	if (type=="a"){
		if (fs.existsSync(makeThumbnailPath(name, ".mp3"))){
			thumbURL = "cache/" + encodeURI(path.basename(name, ".mp3")) + ".jpg";
		}
		else
			thumbURL = "images/music128.png";
	}
	else if (type=="v"){

	}
	return thumbURL;
}

function getList(dir, fileTypeExts, type, __vd__NameWithEndSlash){
	try {
		var items = fs.readdirSync(path.join(__dirname + "\\contents\\" + dir));
		var rtn = [];
		var filepath;
		var rtnItem = {};
		if (items.length > 0){
			for(var i=0; i<items.length; i++) {
				filepath = path.join(__vd__NameWithEndSlash + dir + "/" + items[i]);
				var extname = path.extname(items[i]);
				if ( fileTypeExts.indexOf(extname) >= 0 ){
					rtnItem = { "path": filepath.split("\\").join("/"), 
								"name": items[i], 
								"type": type,
							    "thumb" : getThumbURL(items[i], type) };						
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

 
function prepairMetadata(){
	makeAudioMetaData();
}

function makeThumbnailPath(filename, ext){
	return  __dirname + "/contents/cache/" + path.basename(filename, ext) + ".jpg";
}

function makeThumbnail(contentsDir, items){
	for(var i=0; i<items.length; i++) {
		filepath = path.join(contentsDir + "/" + items[i]);
		var extname = path.extname(items[i]);
		if ( audioFileExt.indexOf(extname) >= 0 ){
			//check exist thumbnail
			if (!fs.existsSync(makeThumbnailPath(filepath, ".mp3"))){
				//2. parsing mp3 metadata							
				var parser = new musicmetadata(filepath, fs.createReadStream(filepath));
				var filename = path.basename(items[i]);
				parser.on('metadata', function(result) {
					if(result.picture[0]){
						//3. save mp3 thumbnails
						fs.writeFileSync(makeThumbnailPath(this.filepath, ".mp3"), result.picture[0].data);
					}
				});
			}
		}
	}
}

function makeAudioMetaData(){
	//1. find mp3 files
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse
	    	//case of shared local directory
	    	if(result.shareddir.contents){
		    	for(var i=0; i<result.shareddir.contents.length; i++){
		     		var contentsDir = __dirname + "\\contents\\" + result.shareddir.contents[i].lnpath;
		     		var items = fs.readdirSync(path.join(contentsDir));
		     		makeThumbnail(contentsDir, items);
		    	}
	    	}
	    	//case of dropbox 
	    	if(result.shareddir.dropbox){
			    for(var i=0; i<result.shareddir.dropbox.length; i++){
		     		var contentsDir = __dirname + "\\contents\\" + result.shareddir.dropbox[i].lnpath;
		     		var items = fs.readdirSync(path.join(contentsDir));
		     		makeThumbnail(contentsDir, items);
			    }
	    	}
	    });
	});
}

app.get('/getVideoList', function(req,res){
	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse	        
	    	for(var i=0; i<result.shareddir.contents.length; i++){
	        	rtn = rtn.concat( getList( String(result.shareddir.contents[i].lnpath), videoFileExt, "v", virtualDirectoryVideo+"/") );
	    	}
		    var returnJson = JSON.stringify(rtn.sort(comp));
		    if(returnJson.length > 0)
		    	res.end(returnJson);
	    });
	});
});

app.post('/getVideoThumbnail', function(req, res){
	var tmpPath = req.body.path;
	var reqVideoId = req.body.selectedVideoId;
	var item = new Object();
	item.selectedVideoId = reqVideoId;
	item.picture = "";

	if(tmpPath) {
		var reqVideoPath = "/contents" + tmpPath.substring(tmpPath.indexOf(virtualDirectoryVideo)+virtualDirectoryVideo.length);
		reqVideoPath = reqVideoPath.replace(/\//g, '\\');  //same-code: reqVideoPath = reqVideoPath.split("/").join("\\");

		//check a previous thumbnail file.
		var thumnailFile = __dirname + "\\" + videoCacheDir + reqVideoPath + ".jpg";
		var thumnailPath = thumnailFile.substring(0, thumnailFile.lastIndexOf('\\'));

		if(fs.existsSync(thumnailFile)) {
			var thumbNailData = fs.createReadStream(thumnailFile, {flags: 'r', encoding: 'base64', bufferSize: 8192 });
			thumbNailData.on('data', function(d) {
				//YOHO:Error - Do not read and append small buffer data. Currently it makes data length error.
				//I don't know why, maybe nodejs fs module bugs!!!. If you avoid this problem,
				//keep bufferSize 2-times larger than jpg file size to read all data of a thumbnail file at a time.
				//base64 encoded size: if original data is 55 bytes, the encoded size is (55/3) * 4 = 19 * 4 = 76 bytes.
				//about 30% increasing.
				item.picture = item.picture + d;
			});
			thumbNailData.on('error', function(e) {
				item.picture = "";
			});
			thumbNailData.on('close', function() {
				res.end(JSON.stringify(item));
				console.log("Screenshots: "+thumnailFile.substring(thumnailFile.lastIndexOf('\\')+1)+" was replied.");
			});
		}
		else {
			// make a directory for thumbnail files.
			fs.mkdirRecursiveSync(thumnailPath);

			// make sure you set the correct path to your video file storage
			var pathToMovie = __dirname + reqVideoPath;
			
			var proc = new ffmpeg({
				source: pathToMovie,  // input source, required
				timeout: 300*60, // timout of the spawned ffmpeg sub-processes in seconds (optional, defaults to 30)
				priority: 0,          // default priority for all ffmpeg sub-processes (optional, defaults to 0 which is no priorization)
				logger: null,        // set a custom [winston](https://github.com/flatiron/winston) logging instance (optional, default null which will cause fluent-ffmpeg to spawn a winston console logger)
				nolog: false        // completely disable logging (optional, defaults to false)
			})
			.withSize('128x128')
			// take 2 screenshots at predefined timemarks
			//.takeScreenshots({ count: 2, timemarks: [ '50%', '75%' ], filename: '%f' }, thumnailPath, function(error, filenames) {
			//.takeScreenshots({ count: 2, timemarks: [ '0.5', '1.0' ], filename: '%f' }, thumnailPath, function(error, filenames) {

			// take 1 screenshots at predefined timemarks
			.takeScreenshots({ count: 1, timemarks: [ '1.0' ], filename: '%f' }, thumnailPath, function(error, filenames) {
				console.log("----Start-Msg-------------------------------------");
				if(error) {
					console.log("Error-Msg: " + error);
				}
				else {
					console.log("Screenshots: "+filenames+" was saved.");
				}
				console.log("----End-Msg---------------------------------------");
				if(filenames) {
					var thumbNailData = fs.createReadStream(thumnailFile, {flags: 'r', encoding: 'base64', bufferSize: 8192 });
					thumbNailData.on('data', function(d) {
						//YOHO:Error - Do not read and append small buffer data. Currently it makes data length error.
						//I don't know why, maybe nodejs fs module bugs!!!. If you avoid this problem,
						//keep bufferSize 2-times larger than jpg file size to read all data of a thumbnail file at a time.
						//base64 encoded size: if original data is 55 bytes, the encoded size is (55/3) * 4 = 19 * 4 = 76 bytes.
						//about 30% increasing.
						item.picture = item.picture + d;
					});
					thumbNailData.on('error', function(e) {
						item.picture = "";
					});
					thumbNailData.on('close', function() {
						res.end(JSON.stringify(item));
						console.log("Screenshots: "+filenames+" was replied.");
						//fs.unlinkSync(thumnailFile);
						//console.log("Screenshots: "+filenames+" was deleted after using.");
					});
				}
				else {
					res.end(JSON.stringify(item));
				}
			});
		}
	}
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

   				if(result.album.length > 0)
   					item.album = result.album;

   				if(result.artist.length > 0)
   					item.artist = result.artist[0];

   				if(result.genre.length > 0)
   					item.genre = result.genre[0];

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

app.get("/"+virtualDirectoryVideo+"/*", function(req, res) {
	res.contentType('m3u8');
	// make sure you set the correct path to your video file storage
	var pathToMovie = __dirname + '/contents/' + req.params[0];
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
		console.log("----Start-Msg-------------------------------------");
		if(error) {
			//console.log("Error-Msg: " + error);
		}
		console.log("Video-File: " + req.params[0] + " has been converted succesfully.");
		console.log("----End-Msg---------------------------------------");
	});
});

console.log('Make the audio metadata db...');
prepairMetadata();

console.log('Ready web server');

app.listen(8888);
