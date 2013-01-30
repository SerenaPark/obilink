var express=require('express'), ffmpeg = require('fluent-ffmpeg');
var app=express();
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var musicmetadata = require('musicmetadata');
var confxmlPath = __dirname + "/../../conf.xml";
var videoFileExt = [".avi", ".mp4"];
var audioFileExt = [".mp3"];
var cacheDirectoryVideo = "cache/video";
var virtualDirectoryVideo = "__vd__video";
var virtualRedirectNormal = "__vr__normal";
var virtualRedirectAndroid = "__vr__android";

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
  app.use(express.static(__dirname));
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

function getAudioThumbURL(name, type){
	var thumbURL;
	if (type=="a"){
		if (fs.existsSync(makeAudioThumbnailPath(name, ".mp3"))){
			thumbURL = "cache/audio/" + encodeURI(path.basename(name, ".mp3")) + ".jpg";
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
							    "thumb" : getAudioThumbURL(items[i], type) };						
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
	fs.mkdirRecursiveSync(__dirname + "/cache/audio/");
	makeAudioMetaData();
}

function makeAudioThumbnailPath(filename, ext){
	return  __dirname + "/cache/audio/" + path.basename(filename, ext) + ".jpg";
}

function makeThumbnail(contentsDir, items){
	for(var i=0; i<items.length; i++) {
		filepath = path.join(contentsDir + "/" + items[i]);
		var extname = path.extname(items[i]);
		if ( audioFileExt.indexOf(extname) >= 0 ){
			//check exist thumbnail
			if (!fs.existsSync(makeAudioThumbnailPath(filepath, ".mp3"))){
				//2. parsing mp3 metadata							
				var parser = new musicmetadata(filepath, fs.createReadStream(filepath));
				var filename = path.basename(items[i]);
				parser.on('metadata', function(result) {
					if(result.picture[0]){
						//3. save mp3 thumbnails
						fs.writeFileSync(makeAudioThumbnailPath(this.filepath, ".mp3"), result.picture[0].data);
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

app.get('/getAudioList', function(req,res){
	prepairMetadata();
	
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
		var thumnailFile = __dirname + "/" + cacheDirectoryVideo + reqVideoPath + ".jpg";
		thumnailFile = thumnailFile.replace(/\//g, '\\');  //same-code: thumnailFile = thumnailFile.split("/").join("\\");
		var thumnailPath = thumnailFile.substring(0, thumnailFile.lastIndexOf('\\'));

		//check a previous thumbnail file.
		if(fs.existsSync(thumnailFile)) {
			var thumbNailData = fs.createReadStream(thumnailFile, {flags: 'r', encoding: 'base64', bufferSize: 8192 });
			thumbNailData.on('data', function(d) {
				//YOHO:Error - Do not read and append small buffer data. Currently it makes data length error.
				//I don't know why, nodejs fs module bugs???. To avoid this problem,
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
			pathToMovie = pathToMovie.replace(/\//g, '\\');

			//check a requested video file.
			if(fs.existsSync(pathToMovie)) {
				var proc = new ffmpeg({
					source: pathToMovie,  // input source, required
					timeout: 300*60, // timout of the spawned ffmpeg sub-processes in seconds (optional, defaults to 30)
					priority: 0,          // default priority for all ffmpeg sub-processes (optional, defaults to 0 which is no priorization)
					logger: null,        // set a custom [winston](https://github.com/flatiron/winston) logging instance (optional, default null which will cause fluent-ffmpeg to spawn a winston console logger)
					nolog: false        // completely disable logging (optional, defaults to false)
				})
				.withSize('128x128')
				// take 2 screenshots at predefined timemarks(50% and 1.0 sec)
				//.takeScreenshots({ count: 2, timemarks: [ '50%', '1.0' ], filename: '%f' }, thumnailPath, function(error, filenames) {
				// take 1 screenshots at predefined timemarks
				.takeScreenshots({ count: 1, timemarks: [ '50%' ], filename: '%f' }, thumnailPath, function(error, filenames) {
					if(error) {
						console.log("Screenshots: " + error);
					}
					else {
						console.log("Screenshots: "+filenames+" was saved.");
					}
					if(filenames) {
						var thumbNailData = fs.createReadStream(thumnailFile, {flags: 'r', encoding: 'base64', bufferSize: 8192 });
						thumbNailData.on('data', function(d) {
							//YOHO:Error - Do not read and append small buffer data. Currently it makes data length error.
							//I don't know why, nodejs fs module bugs???. To avoid this problem,
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
			else {
				res.end(JSON.stringify(item));
				console.log("Screenshots: there is no viedo file at " + pathToMovie);
			}
		}
	}
});

app.get("/"+virtualDirectoryVideo+"/*", function(req, res) {
	// make sure you set the correct path to your video file storage
	var pathToMovie = __dirname + '/contents/' + req.params[0];
	pathToMovie = pathToMovie.replace(/\//g, '\\');
	//-------------------------------------------------------------------
	var tsFile = cacheDirectoryVideo + '/contents/' + req.params[0] + ".ts";
	var outputFile = __dirname + '/' + tsFile;
	outputFile = outputFile.replace(/\//g, '\\');
	var outputPath = outputFile.substring(0, outputFile.lastIndexOf('\\'));
	//-------------------------------------------------------------------
	var userAgent = req.headers["user-agent"];
	var androidStringIndex = userAgent.search(/Android/i);

	if(androidStringIndex != -1) {
		var androidString = userAgent.substring(androidStringIndex);
		var semicolonIndex = androidString.indexOf(';');
		if(semicolonIndex != -1) {
			androidString = androidString.substring(0, semicolonIndex);
		}
		var versionIndex = androidString.search(/ [0-9].[0-9]/i);
		if(versionIndex != -1) {
			androidString = androidString.substring(versionIndex+1);
			var androidVersion = parseInt(androidString);
		}
		else {
			// There is no version but we assume that it is more than 4.0.0.
			var androidVersion = 4;
		}
		if(androidVersion < 4) {
			res.send('Sorry, android version('+androidString+') of your browser is too low to support.<br/>At least, it needs more then Android 4.0.0');
			console.log("Video-File(A): Sorry, android version("+androidString+") of your browser is too low to support.\r\nAt least, it needs more then Android 4.0.0");
			return;
		}
	}

	//check a requested video file.
	if(fs.existsSync(pathToMovie)) {
		if(fs.existsSync(outputFile)) {
			if(androidStringIndex != -1) {
				res.redirect(virtualRedirectAndroid+'/'+tsFile);
			}
			else {
				res.redirect(virtualRedirectNormal+'/'+tsFile+'.m3u8');
			}
		}
		else {
			// check if the requested file is being prepared or was prepared.
			if(fs.existsSync(outputFile+'.preparing')) {
				console.log("Video-File: "+tsFile+' is already preparing.');
				if(androidStringIndex != -1) {
					res.redirect(virtualRedirectAndroid+'/'+tsFile);
				}
				else {
					res.redirect(virtualRedirectNormal+'/'+tsFile+'.m3u8');
				}
			}
			else {
				// from now, even though this request is disconnected or being disconnected
				// the server application(app.js) will keep to covert for next other client requests.

				// make a directory for output files.
				fs.mkdirRecursiveSync(outputPath);

				// touch *.preparing file to mark that the requested file is being prepared or was prepared.
				fs.closeSync(fs.openSync(outputFile+'.preparing', 'a'));
				console.log("Video-File: "+tsFile+' is preparing.');

				// watch if outputFile is created. and then this request is redirected.
				fs.watchFile(outputFile, function (curr, prev) {
					console.log("Video-File: "+tsFile+' is preparing.');
					fs.unwatchFile(outputFile);
					if(androidStringIndex != -1) {
						res.redirect(virtualRedirectAndroid+'/'+tsFile);
					}
					else {
						res.redirect(virtualRedirectNormal+'/'+tsFile+'.m3u8');
					}
				});

				//res.contentType('m3u8');	//res.contentType('mp4');
				var proc = new ffmpeg({
					source: pathToMovie,  // input source, required
					timeout: 300*60, // timout of the spawned ffmpeg sub-processes in seconds (optional, defaults to 30)
					priority: 0,          // default priority for all ffmpeg sub-processes (optional, defaults to 0 which is no priorization)
					logger: null,        // set a custom [winston](https://github.com/flatiron/winston) logging instance (optional, default null which will cause fluent-ffmpeg to spawn a winston console logger)
					nolog: false        // completely disable logging (optional, defaults to false)
				})
				.toFormat('mpegts')  //.toFormat('mp4')
				.withVideoBitrate('480k')
				.withVideoCodec('libx264')
				.withSize('480x320')
				.withAudioBitrate('64k')
				.withAudioCodec('libmp3lame')  //.withAudioCodec('aac')  //.withAudioCodec('libvo_aacenc')
				.addOptions(['-bt 200k', '-subq 7', '-me_range 16', '-qcomp 0.6', '-qmin 10', '-qmax 51'])
				//.addOptions(['-strict -2 -bt 200k', '-subq 7', '-me_range 16', '-qcomp 0.6', '-qmin 10', '-qmax 51'])
				// save to stream
				//.writeToStream(res, function(retcode, error){
				// save to file
				.saveToFile(outputFile, function(retcode, error){
					if(error) {
						console.log("Video-File: " + error);
					}
					console.log("Video-File: " + req.params[0] + " has been converted succesfully.");
				});
			}
		}
	}
	else {
		res.send(404, 'Sorry, your video list may be out-of-date.<br/>Reload the video list and then use it.');
		console.log("Video-File: there is no file at " + pathToMovie);
	}
});

function videoWriteToStream(req, res, requestedFile) {
	var proc = new ffmpeg({
		source: requestedFile, timeout: 300*60, priority: 0, logger: null, nolog: false
	})
	.addOptions(['-vcodec copy','-acodec copy','-f mpegts'])
	// save to stream
	.writeToStream(res, function(retcode, error){
		if(error) {
			console.log("Video-File(A): " + error);
		}
		console.log("Video-File(A): " + req.params[0] + " has been converted succesfully.");
	});
}

app.get("/"+virtualRedirectAndroid+"/*", function(req, res) {
	var tsFile = req.params[0];
	var requestedFile = __dirname + '/' + tsFile;
	requestedFile = requestedFile.replace(/\//g, '\\');

	var pathToMovie = tsFile.substring(tsFile.lastIndexOf(cacheDirectoryVideo)+cacheDirectoryVideo.length, tsFile.lastIndexOf('.'));
	pathToMovie = __dirname + pathToMovie;
	pathToMovie = pathToMovie.replace(/\//g, '\\');

	//check a original file in video list to avoid using out-of-date video list.
	if(fs.existsSync(pathToMovie)) {
		//check a requested video file.
		if(fs.existsSync(requestedFile)) {
			res.contentType('m3u8');
			videoWriteToStream(req, res, requestedFile);
		}
		else {
			// watch if requestedFile is created.
			fs.watchFile(requestedFile, function (curr, prev) {
				fs.unwatchFile(requestedFile);
				res.contentType('m3u8');
				videoWriteToStream(req, res, requestedFile);
			});
		}
	}
	else {
		res.send(404, 'Sorry, your video list may be out-of-date.<br/>Reload the video list and then use it.');
		console.log("Video-File(A): there is no file at " + requestedFile);
	}
});

app.get("/"+virtualRedirectNormal+"/*", function(req, res) {
	var m3u8File = req.params[0];
	var tsFile = m3u8File.substring(0, m3u8File.lastIndexOf('.'));
	var requestedFile = __dirname + '/' + tsFile;
	requestedFile = requestedFile.replace(/\//g, '\\');
	//var m3u8File = "#EXTM3U\r\n#EXT-X-TARGETDURATION:18000\r\n#EXTINF:18000,\r\n"+"http://"+req.headers.host+"/"+tsFile+"\r\n#EXT-X-ENDLIST\r\n";
	var m3u8FileString = "#EXTM3U\r\n#EXTINF:18000,\r\n"+"http://"+req.headers.host+"/"+tsFile+"\r\n";

	var pathToMovie = tsFile.substring(tsFile.lastIndexOf(cacheDirectoryVideo)+cacheDirectoryVideo.length, tsFile.lastIndexOf('.'));
	pathToMovie = __dirname + pathToMovie;
	pathToMovie = pathToMovie.replace(/\//g, '\\');

	//check a original file in video list to avoid using out-of-date video list.
	if(fs.existsSync(pathToMovie)) {
		if(fs.existsSync(requestedFile)) {
			res.contentType('m3u8');
			res.send(m3u8FileString);
		}
		else {
			// watch if requestedFile is created.
			fs.watchFile(requestedFile, function (curr, prev) {
				fs.unwatchFile(requestedFile);
				res.contentType('m3u8');
				res.send(m3u8FileString);
			});
		}
	}
	else {
		res.send(404, 'Sorry, your video list may be out-of-date.<br/>Reload the video list and then use it.');
		console.log("Video-File(N): there is no file at " + requestedFile);
	}
});

console.log('Make the audio metadata db...');
prepairMetadata();

console.log('Ready web server');

app.listen(8888);
