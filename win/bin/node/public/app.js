var express=require('express'), ffmpeg = require('fluent-ffmpeg');
var app=express();
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var musicmetadata = require('musicmetadata');
//var Iconv  = require('iconv').Iconv;
var confxmlPath = __dirname + "/../../conf.xml";
//should use only lower case characters when specifying file extension.
var videoFileExt = [".avi", ".mp4", ".mov", ".wmv", ".mpg", ".mkv"];
var audioFileExt = [".mp3"];
var cacheDirectoryVideo = "cache/video";
var virtualDirectoryVideo = "__vd__video";
var virtualDirectoryVideoThumbnail = "__vd__videothumbnail";
var virtualRedirectVideoNormal = "__vr__videonormal";
var ffmpegBinPath = __dirname + "\\..\\lib\\ffmpeg\\bin";
var audioCacheData = new Array();
var videoFrameSize = "480x320";

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

fs.rmdirRecursiveSync = function(directory) {
	//Converting characters '/' to '\' in the directory path.
	var dirPath = directory.replace(/\//g, '\\');
	var files = [];

	if( fs.existsSync(dirPath)) {
		files = fs.readdirSync(dirPath);
		files.forEach(function(file, index) {
			var curDirPath = dirPath + "\\" + file;
			if(fs.statSync(curDirPath).isDirectory()) {
				// delete curDirPath recursely
				fs.rmdirRecursiveSync(curDirPath);
			}
			else {
				// delete current file.
				fs.unlinkSync(curDirPath);
			}
		});
		fs.rmdirSync(dirPath);
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
			thumbURL = "img/music_default.png";
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
						var cachePath = __dirname + "/cache/audio/" + path.basename(filepath, ".mp3") + ".json";
						var metadata = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf-8')) : "";						
						rtnItem = { "path": filepath.split("\\").join("/"), 
									"name": items[i], 
									"type": type,
									"title" : metadata.title == undefined ? "" : metadata.title,
									"artist" : metadata.artist == undefined ? "" : metadata.artist,
									"album" : metadata.album == undefined ? "" : metadata.album,
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

function makeAudioThumbnail(contentsDir, items){
	for(var i=0; i<items.length; i++) {
		filepath = path.join(contentsDir + "/" + items[i]);
		var extname = path.extname(items[i]);
		if ( audioFileExt.indexOf(extname) >= 0 ){
			//check exist thumbnail
			if (!fs.existsSync(makeAudioThumbnailPath(filepath, ".mp3"))){
				//2. parsing mp3 metadata
				var filename = path.basename(items[i]);
				var parser = new musicmetadata(filepath, fs.createReadStream(filepath));
				parser.on('metadata', function(result) {
					if(result.picture[0]){
						//3. save mp3 thumbnails
						fs.writeFileSync(makeAudioThumbnailPath(this.filepath, ".mp3"), result.picture[0].data);
					}
					if(result.artist.length > 0){						
						var writeItem = {
							"name" :  path.basename(this.filepath),
							"title" : result.title == undefined ? "Unknown" : result.title,
							"artist" : result.artist[0] == undefined ? "" : result.artist[0],
							"album" : result.album == undefined ? "" : result.album,
						};
						var cachepath = __dirname + "/cache/audio/" + path.basename(this.filepath, ".mp3") + ".json";
						if(!fs.existsSync(cachepath))
							fs.writeFileSync(cachepath, JSON.stringify(writeItem));
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
	    	if( (result != undefined) &&
	    		(result.shareddir != undefined) &&
	    		(result.shareddir.contents != undefined) ){	    		
		    	//case of shared local directory
		    	if(result.shareddir.contents){
			    	for(var i=0; i<result.shareddir.contents.length; i++){
			     		var contentsDir = __dirname + "\\contents\\" + result.shareddir.contents[i].lnpath;
			     		var items = fs.readdirSync(path.join(contentsDir));
			     		makeAudioThumbnail(contentsDir, items);
			    	}
		    	}
    		}	    	
	    	if( (result != undefined) &&
	    		(result.shareddir != undefined) &&
	    		(result.shareddir.dropbox != undefined) ){	    		
		    	//case of dropbox 
		    	if(result.shareddir.dropbox){
				    for(var i=0; i<result.shareddir.dropbox.length; i++){
			     		var contentsDir = __dirname + "\\contents\\" + result.shareddir.dropbox[i].lnpath;
			     		var items = fs.readdirSync(path.join(contentsDir));
			     		makeAudioThumbnail(contentsDir, items);
				    }
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
	    	if( (result != undefined) &&
	    		(result.shareddir != undefined) &&
	    		(result.shareddir.contents != undefined) ){
				for(var i=0; i<result.shareddir.contents.length; i++){
		        	rtn = rtn.concat( getList( String(result.shareddir.contents[i].lnpath), audioFileExt, "a") );
		    	}
	  		    var returnJson = JSON.stringify(rtn.sort(comp));
			    if(returnJson.length > 0)
			    	res.end(returnJson);
	    	}
	    	else{
	    		res.end("");
	    	}
	    });
	});
});

app.post('/getAudioInfo', function(req, res){
	if(req.body.path){	
		var reqAudioPath = __dirname + "/contents/" + req.body.path;		

		if(reqAudioPath){
			var parser = new musicmetadata(reqAudioPath, fs.createReadStream(reqAudioPath));		
			parser.on('metadata', function(result) {
	   			if(result.picture){
	   				var item = new Object();
	   				if(result.title.length > 0)
	   					item.title = result.title;

	   				if(result.album.length > 0)
	   					item.album = result.album;

	   				if(result.artist.length > 0)
	   					item.artist = result.artist[0];

	   				if(result.genre.length > 0)
	   					item.genre = result.genre[0];

	   				res.end(JSON.stringify(item));
	   			}
	 		});
		}

	}
});

app.get('/getDropboxAudioList', function(req,res){
	//prepairMetadata();

	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
	    parser.parseString(data, function (err, result) {	//xml2js parse
			if( (result != undefined) &&
	    		(result.shareddir != undefined) &&
	    		(result.shareddir.dropbox != undefined) ){
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
			}
			else{
				res.end("");
			}
	    });
	});
});

app.get('/getDropboxVideoList', function(req,res){
	getVideoList('dropbox',req,res);
});

function makeVideoInfoFiles(category, filepath) {
	var tmpPath = "/contents" + filepath.substring(filepath.lastIndexOf(virtualDirectoryVideo)+virtualDirectoryVideo.length);
	var pathToMovie =  __dirname + decSPACE(tmpPath);
	pathToMovie = pathToMovie.replace(/\//g, '\\');

	if(category == 'info') {
		var infoFile = __dirname + "/" + cacheDirectoryVideo + tmpPath + tmpPath.substring(tmpPath.lastIndexOf('/')) + ".info";
		infoFile = infoFile.replace(/\//g, '\\');
		var infoPath = infoFile.substring(0, infoFile.lastIndexOf('\\'));
		var infoFileName = infoFile.substring(infoFile.lastIndexOf('\\')+1);

		//-------------------------------------------------------------------------------------------
		//check a previous .info file.
		if(fs.existsSync(infoFile)) {
		}
		else {
			// make a directory for .info file.
			fs.mkdirRecursiveSync(infoPath);

			//make .info file for video file.
			var ffprobe_cmd = "PATH=" + ffmpegBinPath + ";%PATH%" + "&" + " cd " + infoPath + "&"
							+ " " + "ffprobe -show_streams -pretty -loglevel quiet -print_format json -i " + "\"" + pathToMovie + "\""
							+ " " + ">" + " " + "\"" + infoFileName + "\"";
			var exec = require("child_process").exec;
			console.log("Video-Info: " + "ffprobe process for information " + infoFileName + " was started.");
			exec(ffprobe_cmd, function (error, stdout, stderr) {
				console.log("Video-Info: " + "ffprobe process for information " + infoFileName + " was terminated.");
				if(error) {
					console.log("Video-Info(error) : " + error);
				}
				if(stderr) {
					console.log("Video-Info(stderr) : " + stderr);
				}
			});
		}
	}

	if(category == 'thumb') {
		var thumbnailFile = __dirname + "/" + cacheDirectoryVideo + tmpPath + tmpPath.substring(tmpPath.lastIndexOf('/')) + ".jpg";
		thumbnailFile = thumbnailFile.replace(/\//g, '\\');
		var thumbnailPath = thumbnailFile.substring(0, thumbnailFile.lastIndexOf('\\'));
		var thumbnailFileName = thumbnailFile.substring(thumbnailFile.lastIndexOf('\\')+1, thumbnailFile.lastIndexOf('.jpg'));

		//check a previous thumbnail file.
		if(fs.existsSync(thumbnailFile)) {
		}
		else {
			// make a directory for thumbnail files.
			fs.mkdirRecursiveSync(thumbnailPath);

			//check a requested video file.
			if(fs.existsSync(pathToMovie)) {

				//make .jpg thumbnail file for video file.
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
				//.takeScreenshots({ count: 2, timemarks: [ '50%', '1.0' ], filename: '%f' }, thumbnailPath, function(error, filenames) {
				// take 1 screenshots at predefined timemarks
				proc.takeScreenshots({ count: 1, timemarks: [ '10%' ], filename: thumbnailFileName }, thumbnailPath, function(error, filenames) {
					if(error) {
						console.log("Screenshots: " + error);
						fs.createReadStream(__dirname+"\\web\\img\\video_default.jpg").pipe(fs.createWriteStream(thumbnailFile));
						console.log("Screenshots: video_default.jpg is copied to " + thumbnailFileName + ".jpg");
					}
					else {
						console.log("Screenshots: "+filenames+" was saved.");
					}
				});
			}
		}
	}
}

function initVideoData() {
	//setup video variables from setting file.
	var settingFile = __dirname + '\\..\\..\\setting';
	var settingCacheFile = (__dirname + '\\' + cacheDirectoryVideo + '\\setting').replace(/\//g, '\\');
	var settingCacheFilePath = settingCacheFile.substring(0, settingCacheFile.lastIndexOf('\\setting'));

	if(fs.existsSync(settingFile)) {  //check a setting file.
		var fileSetting = fs.readFileSync(settingFile, 'utf8'); 
		var fileSettingObject = JSON.parse(fileSetting);
		//set videoFrameSize.
		if(fileSettingObject.video_frame_size) {
			videoFrameSize = fileSettingObject.video_frame_size;
		}
	}
	if(fs.existsSync(settingCacheFile)) {  //check a setting cache file.
		var fileSettingCache = fs.readFileSync(settingCacheFile, 'utf8'); 
		var fileSettingCacheObject = JSON.parse(fileSettingCache);
		//set videoFrameSize.
		if(fileSettingCacheObject.frame_size != videoFrameSize) {
			//set frame_size to current videoFrameSize to save.
			fileSettingCacheObject.frame_size = videoFrameSize;
			fileSettingCache = JSON.stringify(fileSettingCacheObject);
			//remove previous cacheDirectoryVideo directory and all files.
			fs.rmdirRecursiveSync(settingCacheFilePath);
			//should be here after deleting of previous cacheDirectoryVideo directory.
			fs.mkdirRecursiveSync(settingCacheFilePath);
			console.log("initVideoData(): "+cacheDirectoryVideo+" directory was deleted.");
			fs.writeFileSync(settingCacheFile, fileSettingCache, 'utf8');
		}
	}
	else {
		var fileSettingCacheObject = {};
		fileSettingCacheObject.frame_size = videoFrameSize;
		var fileSettingCache = JSON.stringify(fileSettingCacheObject);
		fs.mkdirRecursiveSync(settingCacheFilePath);
		fs.writeFileSync(settingCacheFile, fileSettingCache, 'utf8');
	}

	//make video .info and .jpg thumbnail files.
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
		parser.parseString(data, function (err, result) {	//xml2js parse
			if( (result != undefined) &&
	    		(result.shareddir != undefined) &&
	    		(result.shareddir.contents != undefined) ){
				for(var i=0; i<result.shareddir.contents.length; i++){
					var currList = getList( String(result.shareddir.contents[i].lnpath), videoFileExt, "v");
					for(var j=0; j<currList.length; j++) {
						//check .preparing file to see if previous converted cache files was normally terminated and prepared.
						var tmpPath = "/contents" + currList[j].path.substring(currList[j].path.lastIndexOf(virtualDirectoryVideo)+virtualDirectoryVideo.length);
						var cacheM3u8File = (__dirname + "/" + cacheDirectoryVideo + tmpPath + tmpPath.substring(tmpPath.lastIndexOf('/')) + ".m3u8").replace(/\//g, '\\');
						var cacheM3u8FilePath = cacheM3u8File.substring(0, cacheM3u8File.lastIndexOf('\\'));
						var cachePreparingFile = cacheM3u8File+".preparing";
						var cachePreparedFile = cacheM3u8File+".prepared";
						if(fs.existsSync(cachePreparingFile)) {
							//check a previous .prepared file.
							if(fs.existsSync(cachePreparedFile) != true) {
								//delete incomplete cache files at previous converting time.
								fs.rmdirRecursiveSync(cacheM3u8FilePath);
							}
						}
						//make .info information file for video file.
						makeVideoInfoFiles('info', currList[j].path);
						//make .jpg thumbnail file for video file.
						makeVideoInfoFiles('thumb', currList[j].path);
					}
				}
			}			
		});
	});
}

function getVideoList(category,req,res) {
	var rtn = [];
	var parser = new xml2js.Parser();	//xml2js parser
	fs.readFile(confxmlPath, function(err, data) {
		parser.parseString(data, function (err, result) {	//xml2js parse
			var sharedDir = undefined;

			if( (result != undefined) && (result.shareddir != undefined) ) {
				if(category == 'dropbox') {
					sharedDir = result.shareddir.dropbox;
				}
				else {
					sharedDir = result.shareddir.contents;
				}
			}

			if(sharedDir != undefined) {
				for(var i=0; i<sharedDir.length; i++){
					var currList = getList( String(sharedDir[i].lnpath), videoFileExt, "v");

					//add video file's playtime durarion.
					for(var j=0; j<currList.length; j++){
						var tmpPath = "/contents" + currList[j].path.substring(currList[j].path.lastIndexOf(virtualDirectoryVideo)+virtualDirectoryVideo.length);
						var infoFile = __dirname + "/" + cacheDirectoryVideo + tmpPath + tmpPath.substring(tmpPath.lastIndexOf('/')) + ".info";
						infoFile = infoFile.replace(/\//g, '\\');
						//check a previous .info file.
						if(fs.existsSync(infoFile)) {
							var fileInfo = fs.readFileSync(infoFile, 'utf8'); 
							var fileInfoObject = JSON.parse(fileInfo);
							for(var k=0; k<fileInfoObject.streams.length; k++) {
								if(fileInfoObject.streams[k].codec_type == 'video') {
									//add playtime durarion.
									if(fileInfoObject.streams[k].duration) {
										currList[j].duration = fileInfoObject.streams[k].duration.substring(0, fileInfoObject.streams[k].duration.lastIndexOf('.'));
									}
									else {
										currList[j].duration = 'not available';
									}
									break;
								}
							}
						}
						else {
							// Even though thumbnail files are made in makeVideoInfoFiles() at application's starting time,
							// users can try to add another file to "Share Folders" that he seleced directly after pressing ObiLink App's Sharing Button.

							//make .info information file for video file.
							makeVideoInfoFiles('info', currList[j].path);

							// Even though .info information file is created here,
							// we do set currList[j].duration to 'refresh' to indicate user to represh videolist.
							// the reason that we do not wait and read the new made .info file
							// is to avoid dead state just in case that there is an error or long delay time. 
							currList[j].duration = 'refresh';
						}
					}

					//add current list.
					rtn = rtn.concat(currList);
				}
				var returnJson = JSON.stringify(rtn.sort(comp));
				if(returnJson.length > 0)
					res.end(returnJson);
			}
			else{
				res.end("");	
			}
		});
	});
}

app.get('/getVideoList', function(req,res) {
	getVideoList('contents',req,res);
});

app.get("/"+virtualDirectoryVideoThumbnail+"/*", function(req, res){
	var tmpPath = "/contents/" + req.params[0].substring(0, req.params[0].lastIndexOf('.jpg'));

	if(tmpPath) {
		// make sure you set the correct path to your video file storage
		var pathToMovie = __dirname + decSPACE(tmpPath);
		pathToMovie = pathToMovie.replace(/\//g, '\\');
		var thumbnailFile = __dirname + "/" + cacheDirectoryVideo + tmpPath + tmpPath.substring(tmpPath.lastIndexOf('/')) + ".jpg";
		thumbnailFile = thumbnailFile.replace(/\//g, '\\');
		var thumbnailPath = thumbnailFile.substring(0, thumbnailFile.lastIndexOf('\\'));
		var thumbnailFileName = thumbnailFile.substring(thumbnailFile.lastIndexOf('\\')+1, thumbnailFile.lastIndexOf('.jpg'));

		//check a previous thumbnail file.
		if(fs.existsSync(thumbnailFile)) {
			res.sendfile(thumbnailFile);
			console.log("Screenshots(O): "+thumbnailFile.substring(thumbnailFile.lastIndexOf('\\')+1)+" was replied.");
		}
		else {
			// Even though thumbnail files are made in makeVideoInfoFiles() at application's starting time,
			// users can try to add another file to "Share Folders" that he seleced directly after pressing ObiLink App's Sharing Button.

			//check a requested video file.
			if(fs.existsSync(pathToMovie)) {
				// watch if thumbnailFile is created.
				fs.watchFile(thumbnailFile, function (curr, prev) {
					fs.unwatchFile(thumbnailFile);
						res.sendfile(thumbnailFile);
					console.log("Screenshots(N): "+thumbnailFile.substring(thumbnailFile.lastIndexOf('\\')+1)+" was replied.");
				});
				//make .jpg thumbnail file for video file.
				makeVideoInfoFiles('thumb', virtualDirectoryVideo + "/" + req.params[0].substring(0, req.params[0].lastIndexOf('.')));
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
		var fileExt = pathToMovie.substring(pathToMovie.lastIndexOf('.')); 
		fileExt = fileExt.toLowerCase();
		var mp4DirectService = 'false';

		//If mp4DirectService is available then .mp4 video file is serviced directly without converting and others are converted.
		if ( fileExt == '.mp4' ) {
			var infoFile = __dirname + '/' + cacheDirectoryVideo + tmpPath + tmpPath.substring(tmpPath.lastIndexOf('/')) + ".info";;
			infoFile = infoFile.replace(/\//g, '\\');
			//check .mp4 video file's profile.
			if(fs.existsSync(infoFile)) {
				var fileInfo = fs.readFileSync(infoFile, 'utf8'); 
				var fileInfoObject = JSON.parse(fileInfo);
				for(var k=0; k<fileInfoObject.streams.length; k++) {
					if(fileInfoObject.streams[k].codec_type == 'video') {
						var codec_name = fileInfoObject.streams[k].codec_name.toLowerCase();
						var profile = fileInfoObject.streams[k].profile.toLowerCase();
						var level = fileInfoObject.streams[k].level;
						var profile_main = profile.search(/main/i);
						var profile_baseline = profile.search(/baseline/i);
						console.log("Video-File: mp4 file: codec_name="+codec_name+", profile="+profile+", level="+level);
						if(codec_name == 'h264' && level <= 30 && (profile_main != -1 || profile_baseline != -1)) {
							mp4DirectService = 'true';
							break;
						}
					}
				}
			}
		}

		if ( mp4DirectService == 'true' ) {
			var moviePath = pathToMovie.substring(pathToMovie.indexOf('contents'));
			moviePath = moviePath.replace(/\\/g, '/');
			res.redirect(moviePath);
		}
		else {
			if(fs.existsSync(outputFile)) {
				res.redirect(virtualRedirectVideoNormal+'/'+m3u8File);
			}
			else {
				// check if the requested file is being prepared.
				if(fs.existsSync(outputFile+'.preparing')) {
					console.log("Video-File: "+m3u8File+' is already preparing.');
					res.redirect(virtualRedirectVideoNormal+'/'+m3u8File);
				}
				else {
					// from now, even though this request is disconnected or being disconnected
					// the server application(app.js) will keep to convert for next other client requests.

					// make a directory for output files.
					fs.mkdirRecursiveSync(outputPath);

					// touch *.preparing file to mark that the requested file is being prepared.
					fs.closeSync(fs.openSync(outputFile+'.preparing', 'a'));
					console.log("Video-File: "+m3u8File+' is preparing.');

					// watch if outputFile is created. and then this request is redirected.
					fs.watchFile(outputFile, function (curr, prev) {
						console.log("Video-File: "+m3u8File+' is preparing.');
						fs.unwatchFile(outputFile);
						res.redirect(virtualRedirectVideoNormal+'/'+m3u8File);
					});

					//spawn is used to kill process ffmpeg.exe and segmenter.exe when users terminate oblink.exe
					//while video file is currently being converted.
					var spawn = require("child_process").spawn;

					//select a segmenter of ffmpeg internal or external program. 
					//do not use  ffmpeg internal because there are some caces that iPhone category device shows
					//an error(need approval), not android category device.
					var use_external_segmenter = true;

					if(use_external_segmenter == true) {
						//using external segmenter.exe
						var ffmpeg_args = ['-y','-i',pathToMovie,
										'-f','mpegts','-acodec','libmp3lame','-ar','48000','-ab','128k','-s',videoFrameSize,
										'-vcodec','libx264','-b:v','480000','-bt','200k','-subq','7','-me_range','16',
										'-qcomp','0.6','-qmin','10','-qmax','51','-'
										];
						var segmenter_args = ['-','10',outputFileName,outputFileName+".m3u8",	"./"  //"http://192.168.0.94:8888/"
										];
					}
					else {
						//using internal segmenter of ffmpeg.exe, do not set segment_time to a value below 10.
						var ffmpeg_args = ['-y','-i',pathToMovie,
										'-acodec','libmp3lame','-ar','48000','-ab','128k','-s',videoFrameSize,
										'-vcodec','libx264','-b:v','480000','-bt','200k','-subq','7','-me_range','16',
										'-qcomp','0.6','-qmin','10','-qmax','51',
										'-flags','-global_header','-map','0','-f','segment','-segment_time','10','-segment_list_flags','+live-cache',
										'-segment_list',outputFileName+".m3u8",
										'-segment_format','mpegts',outputFileName+"%d.ts"
										];
					}

					var child_env = process.env;
					child_env.Path = ffmpegBinPath;
					console.log("Video-File: " + "ffmpeg process for " + outputFileName + " was started.");
					var ffmpeg_process = spawn('ffmpeg', ffmpeg_args, {cwd:outputPath, env:child_env});

					if(use_external_segmenter == true) {
						console.log("Video-File: " + "segmenter process for " + outputFileName + " was started.");
						var segmenter_process = spawn('segmenter', segmenter_args, {cwd:outputPath, env:child_env});

						ffmpeg_process.stdout.on('data', function (data) {
							segmenter_process.stdin.write(data);
						});
						ffmpeg_process.stderr.on('data', function (data) {
							//console.log("Video-File(ffmpeg_stderr): " + data);
						});
						ffmpeg_process.on('close', function (code) {
							console.log("Video-File(ffmpeg_close): " + "ffmpeg process for " + outputFileName + " was terminated. exitcode:" + code);
							segmenter_process.stdin.end();
						});
						segmenter_process.stdout.on('data', function (data) {
							//console.log("Video-File(segmenter_stdout): " + data);
						});
						segmenter_process.stderr.on('data', function (data) {
							//console.log("Video-File(segmenter_stderr): " + data);
						});
						segmenter_process.on('close', function (code) {
							// touch *.prepared file to mark that the requested file was prepared.
							fs.closeSync(fs.openSync(outputFile+'.prepared', 'a'));
							console.log("Video-File(segmenter_close): "+m3u8File+' is prepared.');
							console.log("Video-File(segmenter_close): " + "segmenter process for " + outputFileName + " was terminated. exitcode:" + code);
						});
					}
					else {
						ffmpeg_process.stdout.on('data', function (data) {
							//console.log("Video-File(ffmpeg_stdout): " + data);
						});
						ffmpeg_process.stderr.on('data', function (data) {
							//console.log("Video-File(ffmpeg_stderr): " + data);
						});
						ffmpeg_process.on('close', function (code) {
							// touch *.prepared file to mark that the requested file was prepared.
							fs.closeSync(fs.openSync(outputFile+'.prepared', 'a'));
							console.log("Video-File(ffmpeg_close): "+m3u8File+' is prepared.');
							console.log("Video-File(ffmpeg_close): " + "ffmpeg process for " + outputFileName + " was terminated. exitcode:" + code);
						});
					}
				}
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
initVideoData();

console.log('Ready web server');

app.listen(8888);
