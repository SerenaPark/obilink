( function(){
	var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };	
	function formatSecondsAsTime(secs){
		var hr  = Math.floor(secs / 3600);
		var min = Math.floor((secs - (hr * 3600))/60);
		var sec = Math.floor(secs - (hr * 3600) -  (min * 60));

		if (min < 10){ 
			min = "0" + min; 
		}
		if (sec < 10){ 
			sec  = "0" + sec;
		}

		return min + ':' + sec;
	};

	AudioList = (function(){
		function AudioList(root){
			this.$root = $(root);			
			this.filelist = [];
			this.iscroll;
			this.deviceType;
			this.audioContext;
			this.audioSource;
			this.audioAnalizer;
			this.canvasContext;
			this.init();
		    this.readAudioList();
		};

		AudioList.prototype.init = function(){
			this.getDisplayStatus();

	  		this.registEventHandler();

			this.scrollset();
			this.refreshScroll();

			var clouserVar = this;
			$(document).ready(function() {
				var clouserVar2 = clouserVar;
  				$(window).resize(function(){
					clouserVar2.refreshScroll();
				});	
			});

			//get audio context
			// try {
   //              this.audioContext = new webkitAudioContext();
   //              this.audioAnalizer = this.audioContext.createAnalyser();
   //              var canvas = document.getElementById('bgEq');
   //              if(canvas){
   //              	this.canvasContext = canvas.getContext('2d');
   //              	this.canvasContext.fillStyle = '#ffffff';
   //              }                
   //          }
   //          catch(e) {
   //              this.audioContext = null;
   //              this.audioAnalizer = null;
   //          }
		};

		AudioList.prototype.getDisplayStatus = function(){
			var mqTab = window.matchMedia("all and (min-width:650px) and (max-width:1100px)");
			var mqMobile = window.matchMedia("all and (min-width:0px) and (max-width:650px)");
			var mqTv = window.matchMedia("all and (min-width:1100px)");

			if (mqTab.matches){
	  			this.deviceType = "tab";
	  		}
	  		else if(mqMobile.matches){
	  			this.deviceType = "mobile";
	  		}
	  		else if(mqTv.matches){
	  			this.deviceType = "tv";
	  		}
		};

		AudioList.prototype.registEventHandler = function(){
			$("#header .back").click(function(){
			 	$(location).attr('href', "index.html");
			});

			$("#content .prev").click(__bind(function(){
				this.playPrev();
			}, this));

			$("#content .next").click(__bind(function(){
				this.playNext();
			}, this));

	  		$("#footer .wrap .prev").click(__bind(function(){
	  			this.playPrev();
			}, this));

			$("#footer .wrap .next").click(__bind(function(){
				this.playNext();
			}, this));

			$("#footer .wrap .play").click(__bind(function(){
				this.togglePlay();	
			}, this));

			$("#player").bind('timeupdate', __bind(function(){
				var audio = document.getElementById("player");
				$("#footer .wrap .time_start").text(formatSecondsAsTime(audio.currentTime));
				$('.time_control input').val((10*audio.currentTime/audio.duration).toFixed(2).toString()).trigger('change');
			}, this));

			$("#player").bind('ended', __bind(function(){
				this.playNext();
			}, this));
		};

		AudioList.prototype.togglePlay = function(){
			if($("#footer .wrap .play").text() == "d"){
				//pause
				$("#footer .wrap .play").text("e");
				$("#player").trigger("pause");
			}
			else if($("#footer .wrap .play").text() == "e"){
				//play
				$("#footer .wrap .play").text("d");
				$("#player").trigger("play");
				//this.startEq();
			}
		};

		AudioList.prototype.audioStatus = function(){
			if($("#footer .wrap .play").text() == "d"){
				return "play";
			}
			else if($("#footer .wrap .play").text() == "e"){
				return "pause";
			}
		};

		AudioList.prototype.play = function(){
			$("#footer .wrap .play").text("d");
			$("#player").trigger("play");

			//this.startEq();
		};

		AudioList.prototype.pause = function(){
			$("#footer .wrap .play").text("e");
			$("#player").trigger("pause");
		};

		AudioList.prototype.startEq = function(){
			if(this.audioContext){
				var audio = document.getElementById('player');
				// Create a new audio source from the <audio> element
				var source = this.audioContext.createMediaElementSource(audio);
				// Connect up the output from the audio source to the input of the analyser
				source.connect(this.audioAnalizer);
				// Connect up the audio output of the analyser to the audioContext destination i.e. the speakers (The analyser takes the output of the <audio> element and swallows it. If we want to hear the sound of the <audio> element then we need to re-route the analyser's output to the speakers)
				this.audioAnalizer.connect(this.audioContext.destination);

				this.drawEq();
			}			
		};

		AudioList.prototype.drawEq = function(){
			if(!this.audioContext)
				return;

			var canvas = document.getElementById("bgEq");
			if(canvas){
				window.webkitRequestAnimationFrame(__bind(this.drawEq, this));
				var freqByteData = new Uint8Array(this.audioAnalizer.frequencyBinCount);
				// Copy the frequency data into our new array
				this.audioAnalizer.getByteFrequencyData(freqByteData);

				// Clear the drawing display
				this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);

				// For each "bucket" in the frequency data, draw a line corresponding to its magnitude
				for (var i = 0; i < freqByteData.length; i++) {
					this.canvasContext.fillRect(i, canvas.height - freqByteData[i], 1, canvas.height);
				}
			}			
		};

		AudioList.prototype.playNext = function(){
			//------pseudo function
  			//1. stop music now playing
  			var autoplay = false;
  			if(this.audioStatus() == "play"){
  				this.pause();
  				autoplay = true;
  			}
  			//2. find prev music
  			var next = $("#slide .scroll .on .on").next();
  			//2.1 if there is no next music
  			if(next.length <= 0){
  				if( $("#slide .scroll .on").next().length > 0 ){
  					//case of middle of list
  					next = $("#slide .scroll .on").next().children().first();
  				}else{
  					//case of finding last music
  					next = $("#slide .scroll ul:first-child li:first-child");
  				}
  			}	  					
  			//3. select music on slide-list
  			next.click();

  			//4.Move iScroll
  			this.iscroll.scrollToElement("#slide li.on", 100);
  			this.refreshScroll();

  			//5. play music
  			if(autoplay)
  				this.play();
		};

		AudioList.prototype.playPrev = function(){
			//------pseudo function
  			//1. stop music now playing
  			var autoplay = false;
  			if(this.audioStatus() == "play"){
  				this.pause();
  				autoplay = true;
  			}

  			//2. find prev music
  			var prev = $("#slide .scroll .on .on").prev();
  			//2.1 if there is no prev music
  			if(prev.length <= 0){
  				if( $("#slide .scroll .on").prev().length > 0 ){
  					//case of middle of list
  					prev = $("#slide .scroll .on").prev().children().last();
  				}else{
  					//case of finding last music
  					prev = $("#slide .scroll ul:last-child li:last-child");
  				}
  			}	  					
  			//3. select music on slide-list
  			prev.click();

  			//4.Move iScroll
  			this.iscroll.scrollToElement("#slide li.on", 100);
  			this.refreshScroll();

  			//5. play music
  			if(autoplay)
  				this.play();
			//console.log("prev");
		};

		AudioList.prototype.scrollset = function(){
			this.iscroll = new iScroll('slide', {
				snap:false,
				hScrollbar: false,
				vScrollbar: false,
				momentum: true,		
				bounce: true,		
				lockDirection :true
			});
		};

		AudioList.prototype.onError = function(req, status, error){
			//alert("code : " + req.status + "\r\nmessage : " + req.reponseText);
			console.log("code : " + req.status + "\r\nmessage : " + req.responseText);
		};

		AudioList.prototype.getInnerHTML = function(data, type){
			var innerHTML = "";
			var index = 0;
			var ison;
			var songTitle;
			for(var i=0; i<data.length/5; i++){
				if(index == 0)
					innerHTML += "<ul class='on'>";
				else
					innerHTML += "<ul>";
				for(var j=0; j<5 && index<data.length; j++){
					if(index == 0){
						ison = "class='on' ";
					}						
					else{
						ison = ""
					}
					innerHTML += "<li " + ison;
					innerHTML += "data_filename=\"" + data[index].name + "\"";
					if(data[index].title)
						innerHTML += "data_title=\"" + data[index].title + "\"";
					if(data[index].artist)
						innerHTML += "data_artist=\"" + data[index].artist + "\"";
					if(data[index].album)
						innerHTML += "data_album=\"" + data[index].album + "\"";
					innerHTML += "data_path=\"" + data[index].path + "\">";

					innerHTML += "<img src=" + data[index].thumb + " alt=''> \
								<h2> \
						            <b>" + this.getAudioName(data[index]) + "</b> \
						        </h2> \
								<span class='ico symbol'>e</span> \
						        </li>";
					index++;
				}
				innerHTML += "</ul>";
			}
			return innerHTML;
		};

		AudioList.prototype.getAudioName = function(data){
			var songTitle;
			if(data.title){
				if(data.artist)
					songTitle = data.title + " (" + data.artist + ")";
				else
					songTitle = data.title;
			}
			else
				songTitle = data.name;
			return songTitle;
		};

		AudioList.prototype.registEventHandleOnSlideCtrl = function(){
			var that = this;
			//assing handler			
			$("#slide li").click(function(){
				var i = $(this).find("img").attr("src");
				//set background
				$("#bg").css('background-image','url(\"'+i+'\")');

				//set selected item on landscape
				$("#slide li").removeClass("on");
				$(this).addClass("on");
				$("#slide ul").removeClass("on");
				$(this).parent().addClass("on");

				//set selected item's title on landscape
				var tempThis = $(this);
				var data = {
					title: tempThis.attr("data_title"),
					name: tempThis.attr("data_filename"),
					artist: tempThis.attr("data_artist"), 
					album : tempThis.attr("data_album")
				};
				that.displaySelectedAudio(data);

				//set footer play button
				$("#footer .wrap .play").text("e");

				var audio = document.getElementById("player");	
				audio.addEventListener("loadedmetadata", function(){
					//set time
					$("#footer .wrap .time_end").text(formatSecondsAsTime(this.duration));
				});

				$('.time_control input').val("0").trigger('change');
			});
		};

		AudioList.prototype.onTimeSlideMouseUp = function(position){
			var audio = document.getElementById("player");
			audio.currentTime = audio.duration*position/10;
		};

		AudioList.prototype.refreshScroll = function(){
			var hh =  $("body").height();
			var ww =  $("body").width();				
			if(hh < ww){
				$("#slide .scroll").width($("#slide ul").length * 100+"%");		
				$("#slide ul").width(100/$("#slide ul").length+"%");	
			}
			if(hh > ww){//portrait
				$("#slide .scroll").width(100+"%");		
				$("#slide ul").width(100+"%");		
			}
			this.iscroll.refresh();
			$('.time_control input').slideControl(null,this.onTimeSlideMouseUp);
		};

		AudioList.prototype.displaySelectedAudio = function(data){
			var songTitle;
			if(data.title){
				if(data.artist)
					songTitle = data.title + " (" + data.artist + ")";
				else
					songTitle = data.title;
			}
			else
				songTitle = data.name;
			$("#selectedTitle").text(songTitle);
			$("#footer .wrap .title > h3").text(songTitle);

			var display;
			if(data.artist && (data.album==undefined))
				display = data.artist;
			else if(data.artist && data.album)
				display = data.artist + " - " + data.album;
			else if((data.artist==undefined) && data.album)
				display = "Unknown Artist - " + data.album;
			else
				display = "";
			$("#footer .wrap .title > p").text(display);
		};		

		AudioList.prototype.onReadAudioList = function(data){
			if(data.length == 0){
				//no contents display				
				$(".nocontent").ready(function(){
					$("#slide").css("display", "none");
					$("div.prev, div.next").css("display", "none");
				});	
				var innerHTML = "<div class='nocontent'>\
									<div class='nolist'>재생할 콘텐츠가 없습니다</div>\
									<div id='bg' class='audio'>\
								</div>";						
				$("#slide").parent().append(innerHTML);				
			} else {
				//set HTML for landscape
				var innerHTML = this.getInnerHTML(data);
				$("#slide .scroll").append(innerHTML);
				//$("#selectedTitle").text(data[0].name);
				$("#bg").css('background-image','url(\"'+data[0].thumb+'\")');
				$("#player").attr("src", data[0].path);

				this.displaySelectedAudio(data[0]);

				//set time
				var audio = document.getElementById("player");
				audio.addEventListener("loadedmetadata", function(){
					//display time when metadata loaded
					$("#footer .wrap .time_end").text(formatSecondsAsTime(this.duration));
				});

				this.registEventHandleOnSlideCtrl();

				this.refreshScroll();
			}			
		};

		AudioList.prototype.readAudioList = function(){
			var vl = this;
			var ajaxUrl;

			if($("#header .wrap h1").text() == "Music")
				ajaxUrl = "getAudioList";
			else if($("#header .wrap h1").text() == "Dropbox Music")
				ajaxUrl = "getDropboxAudioList";

			$.ajax({
				type : "GET"
				, async : true
				, url : ajaxUrl
				, dataType : "json"
				, timeout : 3000
				, cache : false
				, contentType : "application/x-www-form-urlencoded; charset=UTF-8"
				, error : function(req, error){
					__bind(vl.onError(req, status, error), vl);
				}				
				, success : function(data){
					__bind(vl.onReadAudioList(data), vl);
				}				
			});
		};

		return AudioList;
	})();

	$(function(){	    
	    return new AudioList();
	});

}).call(this);
