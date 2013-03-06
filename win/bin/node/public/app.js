var express=require('express'), ffmpeg = require('fluent-ffmpeg');
var app=express();
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var musicmetadata = require('musicmetadata');
//var Iconv  = require('iconv').Iconv;
var confxmlPath = __dirname + "/../../conf.xml";
//should use only lower case characters when specifying file extension.
var videoFileExt = [".avi", ".mp4", ".mov"];
var audioFileExt = [".mp3"];
var cacheDirectoryVideo = "cache/video";
var virtualDirectoryVideo = "__vd__video";
var virtualDirectoryVideoThumbnail = "__vd__videothumbnail";
var virtualRedirectVideoNormal = "__vr__videonormal";
var ffmpegBinPath = __dirname + "\\..\\lib\\ffmpeg\\bin";
	
//Set m3u8's mimetype to "application/vnd.apple.mpegurl" instead of "application/x-mpegURL".
express.static.mime.define({'application/vnd.apple.mpegurl': ['m3u8']});

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

function encSPACE(string) {
	string = string.replace(/ /g, '_-_-');
	return string;
}

function decSPACE(string) {
	string = string.replace(/_-_-/g, ' ');
	return string;
}

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

function getList(dir, fileTypeExts, type){
	try {
		var items = fs.readdirSync(path.join(__dirname + "\\contents\\" + dir));
		var rtn = [];
		var filepath;
		var rtnItem = {};
		if (items.length > 0){
			for(var i=0; i<items.length; i++) {
				filepath = path.join(dir + "/" + items[i]);
				var extname = path.extname(items[i]);
				extname = extname.toLowerCase();
				if ( fileTypeExts.indexOf(extname) >= 0 ){
					if(type == "a"){
						rtnItem = { "path": filepath.split("\\").join("/"), 
									"name": items[i], 
									"type": type,
									"thumb" : getAudioThumbURL(items[i], type) };
					}
					else if(type == "v"){
						rtnItem = { "path": encSPACE(virtualDirectoryVideo + "/" + filepath.split("\\").join("/")), 
									"name": items[i], 
									"type": type,
									"thumb" : encSPACE(virtualDirectoryVideoThumbnail + "/" + filepath.split("\\").join("/") + ".jpg") };
					}
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
					if(result.artist.length > 0){
						var jsonPath = ( __dirname + "/cache/audio/cache.json");
						//var iconv = new Iconv('EUC-KR', 'UTF-8');
						//var artist = iconv.convert(result.artist[0]);
						var writeItem = {
							"name" :  path.basename(this.filepath),
							"artist" : result.artist[0]
						};
						fs.appendFileSync(jsonPath, JSON.stringify(writeItem));
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

app.get('/getDropboxAudioList', function(req,res){
	//prepairMetadata();

	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse
	    	 for(var i=0; i<result.shareddir.dropbox.length; i++){
	    		rtn = rtn.concat( getList(String(result.shareddir.dropbox[i].lnpath), audioFileExt, "a"));
	    	} 
	    	/*var vlist = getList( String(result.shareddir.dropbox[0].lnpath), videoFileExt, "v" );	    	
	    	var alist = getList( String(result.shareddir.dropbox[0].lnpath), audioFileExt, "a" );
	    	vlist.sort(comp);
	    	alist.sort(comp);*/
	    	var returnJson = JSON.stringify(rtn.sort(comp));
		    if(returnJson.length > 0)
		    	res.end(returnJson);
	    });
	});
});

app.get('/getDropboxVideoList', function(req,res){
	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse
	    	for(var i=0; i<result.shareddir.dropbox.length; i++){
	    		rtn = rtn.concat( getList(String(result.shareddir.dropbox[i].lnpath), videoFileExt, "v"));
	    	}
	    	var returnJson = JSON.stringify(rtn.sort(comp));
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
	        	rtn = rtn.concat( getList( String(result.shareddir.contents[i].lnpath), videoFileExt, "v") );
	    	}
		    var returnJson = JSON.stringify(rtn.sort(comp));
		    if(returnJson.length > 0)
		    	res.end(returnJson);
	    });
	});
});

app.get("/"+virtualDirectoryVideoThumbnail+"/*", function(req, res){
	var tmpPath = "/contents/" + req.params[0].substring(0, req.params[0].lastIndexOf('.'));

	if(tmpPath) {
		// make sure you set the correct path to your video file storage
		var pathToMovie = __dirname + decSPACE(tmpPath);
		pathToMovie = pathToMovie.replace(/\//g, '\\');
		var thumnailFile = __dirname + "/" + cacheDirectoryVideo + tmpPath + tmpPath.substring(tmpPath.lastIndexOf('/')) + ".jpg";
		thumnailFile = thumnailFile.replace(/\//g, '\\');
		var thumnailPath = thumnailFile.substring(0, thumnailFile.lastIndexOf('\\'));
		var thumnailFileName = thumnailFile.substring(thumnailFile.lastIndexOf('\\')+1, thumnailFile.lastIndexOf('.jpg'));

		//check a previous thumbnail file.
		if(fs.existsSync(thumnailFile)) {
			res.sendfile(thumnailFile);
			console.log("Screenshots: "+thumnailFile.substring(thumnailFile.lastIndexOf('\\')+1)+" was replied.");
		}
		else {
			// make a directory for thumbnail files.
			fs.mkdirRecursiveSync(thumnailPath);

			//check a requested video file.
			if(fs.existsSync(pathToMovie)) {
				var proc = new ffmpeg({
					source: pathToMovie,  // input source, required
					timeout: 300*60, // timout of the spawned ffmpeg sub-processes in seconds (optional, defaults to 30)
					priority: 0,          // default priority for all ffmpeg sub-processes (optional, defaults to 0 which is no priorization)
					logger: null,        // set a custom [winston](https://github.com/flatiron/winston) logging instance (optional, default null which will cause fluent-ffmpeg to spawn a winston console logger)
					nolog: false        // completely disable logging (optional, defaults to false)
				});
				proc.setFfmpegPath(ffmpegBinPath+'\\ffmpeg');
				proc.withSize('128x128');
				// take 2 screenshots at predefined timemarks(50% and 1.0 sec)
				//.takeScreenshots({ count: 2, timemarks: [ '50%', '1.0' ], filename: '%f' }, thumnailPath, function(error, filenames) {
				// take 1 screenshots at predefined timemarks
				proc.takeScreenshots({ count: 1, timemarks: [ '10%' ], filename: thumnailFileName }, thumnailPath, function(error, filenames) {
					if(error) {
						console.log("Screenshots: " + error);
					}
					else {
						console.log("Screenshots: "+filenames+" was saved.");
					}
					if(filenames) {
						res.sendfile(thumnailFile);
						console.log("Screenshots: "+filenames+" was replied.");
					}
					else {
						res.end();
						//or send default image.
						//res.sendfile( __dirname+"\\web\\img\\video128.png");
					}
				});
			}
			else {
				res.end();
				//or send default image.
				//res.sendfile( __dirname+"\\web\\img\\video128.png");
				console.log("Screenshots: there is no viedo file at " + pathToMovie);
			}
		}
	}
});

app.get("/"+virtualDirectoryVideo+"/*", function(req, res) {
	var tmpPath = '/contents/' + req.params[0];

	// make sure you set the correct path to your video file storage
	var pathToMovie = __dirname + decSPACE(tmpPath);
	pathToMovie = pathToMovie.replace(/\//g, '\\');
	//-------------------------------------------------------------------
	var m3u8File = cacheDirectoryVideo + tmpPath + tmpPath.substring(tmpPath.lastIndexOf('/')) + ".m3u8";
	var outputFile = __dirname + '/' + m3u8File;
	outputFile = outputFile.replace(/\//g, '\\');
	var outputPath = outputFile.substring(0, outputFile.lastIndexOf('\\'));
	var outputFileName = outputFile.substring(outputFile.lastIndexOf('\\')+1, outputFile.lastIndexOf('.m3u8'));
	//-------------------------------------------------------------------
	console.log("Video-File(A): UserAgent:"+ req.headers["user-agent"]);

	//check a requested video file.
	if(fs.existsSync(pathToMovie)) {
		if(fs.existsSync(outputFile)) {
			res.redirect(virtualRedirectVideoNormal+'/'+m3u8File);
		}
		else {
			// check if the requested file is being prepared or was prepared.
			if(fs.existsSync(outputFile+'.preparing')) {
				console.log("Video-File: "+m3u8File+' is already preparing.');
					res.redirect(virtualRedirectVideoNormal+'/'+m3u8File);
			}
			else {
				// from now, even though this request is disconnected or being disconnected
				// the server application(app.js) will keep to covert for next other client requests.

				// make a directory for output files.
				fs.mkdirRecursiveSync(outputPath);

				// touch *.preparing file to mark that the requested file is being prepared or was prepared.
				fs.closeSync(fs.openSync(outputFile+'.preparing', 'a'));
				console.log("Video-File: "+m3u8File+' is preparing.');

				// watch if outputFile is created. and then this request is redirected.
				fs.watchFile(outputFile, function (curr, prev) {
					console.log("Video-File: "+m3u8File+' is preparing.');
					fs.unwatchFile(outputFile);
					res.redirect(virtualRedirectVideoNormal+'/'+m3u8File);
				});

				var exec = require("child_process").exec;

				//using external segmenter.exe
				var ffmpeg_cmd = "PATH=" + ffmpegBinPath + ";%PATH%" + "&" + " cd " + outputPath + "&"
								+ " " + "ffmpeg -y -i " + "\"" + pathToMovie + "\""
								+ " " + "-f mpegts -acodec libmp3lame -ar 48000 -ab 128k -s 480x320"
								+ " " + "-vcodec libx264 -b:v 480000 -bt 200k -subq 7 -me_range 16"
								+ " " + "-qcomp 0.6 -qmin 10 -qmax 51 - | segmenter - 10"
								+ " " + "\"" + outputFileName + "\""
								+ " " + "\"" + outputFileName + ".m3u8" + "\""
								+ " " + "./";  //"http://192.168.0.94:8888/";

				//using internal segmenter of ffmpeg.exe
				var xxxffmpeg_cmd = "PATH=" + ffmpegBinPath + ";%PATH%" + "&" + " cd " + outputPath + "&"
								+ " " + "ffmpeg -y -i " + "\"" + pathToMovie + "\""
								+ " " + "-acodec libmp3lame -ar 48000 -ab 128k -s 480x320"
								+ " " + "-vcodec libx264 -b:v 480000 -bt 200k -subq 7 -me_range 16"
								+ " " + "-qcomp 0.6 -qmin 10 -qmax 51"
								+ " " + "-flags -global_header -map 0 -f segment -segment_time 5 -segment_list_flags +live-cache"
								+ " " + "-segment_list " + "\"" + outputFileName + ".m3u8" + "\""
								+ " " + "-segment_format mpegts " + "\"" + outputFileName + "%05d.ts" + "\"";

				console.log("Video-File: " + "ffmpeg process for " + outputFileName + " was started.");
				exec(ffmpeg_cmd, function (error, stdout, stderr) {
					console.log("Video-File: " + "ffmpeg process for " + outputFileName + " was terminated.");
					if(error) {
						console.log("Video-File : " + error);
					}
					if(stdout) {
						//console.log("Video-File : " + stdout);
					}
					if(stderr) {
						//console.log("Video-File : " + stderr);
					}
				});
			}
		}
	}
	else {
		res.send(404, 'Sorry, your video list may be out-of-date.<br/>Reload the video list and then use it.');
		console.log("Video-File: there is no file at " + pathToMovie);
	}
});

app.get("/"+virtualRedirectVideoNormal+"/*", function(req, res) {
	var tmpPath = req.params[0];
	var redirectM3u8File = tmpPath;
	var pathToM3u8File = __dirname + '/' + tmpPath;
	pathToM3u8File = pathToM3u8File.replace(/\//g, '\\');
	// make sure you set the correct path to your video file storage
	var pathToMovie =  __dirname + decSPACE(tmpPath.substring(tmpPath.lastIndexOf(cacheDirectoryVideo)+cacheDirectoryVideo.length, tmpPath.lastIndexOf('/')));
	pathToMovie = pathToMovie.replace(/\//g, '\\');

	console.log("Video-File(N): UserAgent:"+ req.headers["user-agent"]);
	
	//check a original file in video list to avoid using out-of-date video list.
	if(fs.existsSync(pathToMovie)) {
		if(fs.existsSync(pathToM3u8File)) {
			res.redirect(redirectM3u8File);
		}
		else {
			// watch if requestedFile is created.
			fs.watchFile(pathToM3u8File, function (curr, prev) {
				fs.unwatchFile(pathToM3u8File);
				res.redirect(redirectM3u8File);
			});
		}
	}
	else {
		res.send(404, 'Sorry, your video list may be out-of-date.<br/>Reload the video list and then use it.');
		console.log("Video-File(N): there is no file at " + pathToMovie);
	}
});

console.log('Make the audio metadata db...');
prepairMetadata();

console.log('Ready web server');

app.listen(8888);
