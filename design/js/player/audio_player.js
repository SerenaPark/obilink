  ( function(){
  //function bind
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    $(function(){

      $("#jquery_jplayer_1").jPlayer({
        ready: function () {
          $(this).jPlayer("setMedia", {
            title: "Bubble",
            m4a: "http://www.jplayer.org/audio/m4a/Miaow-07-Bubble.m4a",
            //mp3: "http://minkbooks.com/content/beach.mp3",
            oga: "http://www.jplayer.org/audio/ogg/Miaow-07-Bubble.ogg"
          });
        },
        swfPath: "/js",
        supplied: "mp3, m4a, oga"
      });
    });
}).call(this);