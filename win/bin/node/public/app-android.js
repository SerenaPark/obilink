var express = require('express');
var app = express();
var bridge = require('bridge');
var mr = bridge.load('com.koccalink.anode.module.MediaRetriever', this);

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

MEDIA_COLUMN_ID = '_id';
MEDIA_COLUMN_PATH = '_data';
MEDIA_COLUMN_DISPLAY_NAME = '_display_name';
MEDIA_COLUMN_TITLE = 'title';
MEDIA_COLUMN_ALBUM_ID = 'album_id';
MEDIA_COLUMN_ALBUM_ART = 'album_art';

app.configure(function() {
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

  if (mr.prepare(MEIDA_TYPE_AUDIO)) {
    var nameIndex = mr.getColumnIndex(MEDIA_COLUMN_TITLE);
    var pathIndex = mr.getColumnIndex(MEDIA_COLUMN_PATH);
    var albumIdIndex = mr.getColumnIndex(MEDIA_COLUMN_ALBUM_ID);

    if (mr.moveToFirst()) {      
      var name;
      var path;

      do {
        name = mr.getStringValue(nameIndex);
        path = mr.getStringValue(pathIndex);
        albumId = mr.getStringValue(albumIdIndex);

        var item = { 'path': path, 'name': name, 'type': 'a', 'albumId': albumId };
        rtn.push(item);
      } while (mr.moveToNext());
    }
  }

  returnJson = JSON.stringify(rtn.sort(comp));
  if (returnJson.length > 0)
    res.end(returnJson);
});


app.post('/getAudioThumbnail', function(req, res) {
  var reqAlbumId = req.body.path;
  var reqAudioId = req.body.selectedAudioId;

  if (mr.prepare(MEIDA_TYPE_AUDIO_ALBUM, reqAlbumId)) {
    var albumArtIndex = mr.getColumnIndex(MEDIA_COLUMN_ALBUM_ART);

    if (mr.moveToFirst()) {      
        albumArt = mr.getBitmapValue(albumArtIndex);
        var item = new Object();
        item.selectedAudioId = reqAudioId;
        item.picture = albumArt;

        res.end(JSON.stringify(item));
    }
  }
});


app.listen(8888);