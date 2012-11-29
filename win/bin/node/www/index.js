var express=require('express');
var app=express();
var fs = require('fs');

app.configure( function(){
  app.use(express.methodOverride());
  app.use(express.static(__dirname+ ''));
  app.use(app.router);
});

app.get(/getVideoList/, function(req,res){
	console.log('connected getVideoList');
	//res.write("1");  
	res.end();  
});

console.log('Express server start');

app.listen(8888);