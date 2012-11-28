var express=require('express'),app=express();

app.configure( function(){
  app.use(express.methodOverride());
  app.use(express.static(__dirname+''));
  app.use(app.router);
});

app.listen(8888);