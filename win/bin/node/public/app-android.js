var express = require('express');
var app = express();
var bridge = require('bridge');
var mr = bridge.load('org.obilink.impl.MediaRetrieverImpl', this);
var fs = require('fs');

//var fs = require('fs');
//var path = require('path');
//var xml2js = require('xml2js');
//var confxmlPath = __dirname + "/../../conf.xml";
//var videoFileExt = [".avi", ".mp4"];
//var audioFileExt = [".mp3"];
//var pictureFileExt = [".jpeg", ".JPEG", ".jpg", ".JPEG", ".gif", ".GIF"];


MEIDA_TYPE_AUDIO = 'audio';
MEIDA_TYPE_AUDIO_ALBUM = 'album';
MEIDA_TYPE_VIDEO = 'video';
MEIDA_TYPE_VIDEO_THUMBNAILS = 'video.thumbnails';

MEDIA_COLUMN_ID = '_id';
MEDIA_COLUMN_PATH = '_data';
MEDIA_COLUMN_DISPLAY_NAME = '_display_name';
MEDIA_COLUMN_TITLE = 'title';
MEDIA_COLUMN_ALBUM_ID = 'album_id';
MEDIA_COLUMN_ALBUM_ART = 'album_art';
MEDIA_COLUMN_THUMBNAILS_DATA = '_data';
MEDIA_COLUMN_MINI_THUMB_MAGIC = 'mini_thumb_magic';


app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: "secret",
    store: new express.session.MemoryStore
  }));
  app.use(express.static(__dirname + '/web'));
  app.use(express.static(__dirname));
  app.use(express.directory(__dirname + '/web'));
  app.use(app.router);
  app.use(express.logger('dev'));
});

app.get('/thumb/audio/*', function(req, res) {
  var paramStr = req.params[0].toString();
  var realPath = paramStr.substring(0, paramStr.lastIndexOf('.'));

  res.setHeader('Content-Type', 'image/bmp');
  res.statusCode = 200;

  var file = fs.createReadStream(realPath);
  file.on('open', function() {
    file.pipe(res);
  });
});

app.get('/thumb/video/*', function(req, res) {
  var paramStr = req.params[0].toString();
  var realPath = paramStr;

  res.setHeader('Content-Type', 'image/jpeg');
  res.statusCode = 200;

  var file = fs.createReadStream(realPath);
  file.on('open', function() {
    file.pipe(res);
  });
});

app.get('/audio/*', function(req, res){
  var paramStr = req.params[0].toString();
  var realPath = paramStr;

  res.setHeader('Content-Type', 'audio/mpeg');
  res.statusCode = 200;

  var file = fs.createReadStream(realPath);
  file.on('open', function() {
    file.pipe(res);
  });
});

app.get('/video/*', function(req, res){
  var paramStr = req.params[0].toString();
  var realPath = paramStr;

  res.setHeader('Content-Type', 'video/mp4');
  res.statusCode = 200;

  var file = fs.createReadStream(realPath);
  file.on('open', function() {
    file.pipe(res);
  });
});

function comp(a, b){
  if (a.name < b.name)
    return -1;
  if (a.name > b.name)
    return 1;
  return 0;
}

app.get('/getAudioList', function(req,res) {
  var rtn = [];
  var returnJson;
  var audioCursor;

  if ((audioCursor = mr.prepare(MEIDA_TYPE_AUDIO))) {
    var nameIndex = mr.getColumnIndex(audioCursor, MEDIA_COLUMN_TITLE);
    var pathIndex = mr.getColumnIndex(audioCursor, MEDIA_COLUMN_PATH);
    var albumIdIndex = mr.getColumnIndex(audioCursor, MEDIA_COLUMN_ALBUM_ID);

    if (mr.moveToFirst(audioCursor)) {      
      var path;
      var name;
      var albumId;
      var albumArt;

      do {
        path = mr.getStringValue(audioCursor, pathIndex);
        name = mr.getStringValue(audioCursor, nameIndex);
        albumId = mr.getStringValue(audioCursor, albumIdIndex);
        albumArt = ""; //default album art

        var albumCursor;
        if ((albumCurosr = mr.prepare(MEIDA_TYPE_AUDIO_ALBUM, albumId))) {
          var albumArtIndex = mr.getColumnIndex(albumCurosr, MEDIA_COLUMN_ALBUM_ART);

          if (mr.moveToFirst(albumCurosr)) {      
              albumArt = mr.getStringValue(albumCurosr, albumArtIndex);
          }

          mr.close(albumCursor);
        }

        if (albumArt == undefined)
          albumArt = '/img/music_default.png';
        else
          albumArt = '/thumb/audio' + albumArt + '.bmp';

        var item = { 'path': '/audio' + path, 'name': name, 'type': 'a', 'thumb': albumArt };
        rtn.push(item);

      } while (mr.moveToNext(audioCursor));      
    }

    mr.close(audioCursor);
  }

  returnJson = JSON.stringify(rtn.sort(comp));
  if (returnJson.length > 0)
    res.end(returnJson);
});

app.get('/getVideoList', function(req,res) {
  var rtn = [];
  var returnJson;
  var videoCursor;

  if ((videoCursor = mr.prepare(MEIDA_TYPE_VIDEO))) {
    var nameIndex = mr.getColumnIndex(videoCursor, MEDIA_COLUMN_TITLE);
    var pathIndex = mr.getColumnIndex(videoCursor, MEDIA_COLUMN_PATH);
    var idIndex = mr.getColumnIndex(videoCursor, MEDIA_COLUMN_ID);

    if (mr.moveToFirst(videoCursor)) {      
      var path;
      var name;
      var videoId;
      var thumbnail;

      do {
        path = mr.getStringValue(videoCursor, pathIndex);
        name = mr.getStringValue(videoCursor, nameIndex);
        videoId = mr.getStringValue(videoCursor, idIndex);

        var thumbnailCursor;
        if ((thumbnailCursor = mr.prepare(MEIDA_TYPE_VIDEO_THUMBNAILS, videoId))) {
          var thumbnailIndex = mr.getColumnIndex(thumbnailCursor, MEDIA_COLUMN_PATH);

          if (mr.moveToFirst(thumbnailCursor)) {      
              thumbnail = mr.getStringValue(thumbnailCursor, thumbnailIndex);
          }

          mr.close(thumbnailCursor);
        }

        
        if (thumbnail == undefined)
          thumbnail = '/img/video_default.jpg';
        else
          thumbnail = '/thumb/video' + thumbnail;

        var item = { 'path': '/video' + path, 'name': name, 'type': 'v', 'thumb': thumbnail };
        rtn.push(item);

      } while (mr.moveToNext(videoCursor));      
    }

    mr.close(videoCursor);
  }

  returnJson = JSON.stringify(rtn.sort(comp));
  if (returnJson.length > 0)
    res.end(returnJson);
});

app.listen(8888);