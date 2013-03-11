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
		};

		AudioList.prototype.getDisplayStatus = function(){
			var mqTab = window.matchMedia("all anssd (min-width:650px) and (max-width:1100px)");
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
		};

		AudioList.prototype.pause = function(){
			$("#footer .wrap .play").text("e");
			$("#player").trigger("pause");
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
			for(var i=0; i<data.length/5; i++){
				if(index == 0)
					innerHTML += "<ul class='on'>";
				else
					innerHTML += "<ul>";
				for(var j=0; j<5 && index<data.length; j++){
					if(index == 0)
						innerHTML += "<li class='on' data_title=\""+ data[index].name +"\" data_path=\""+ data[index].path +"\">";
					else
						innerHTML += "<li data_title=\""+ data[index].name +"\" data_path=\""+ data[index].path +"\">";

					innerHTML += "<img src=" + data[index].thumb + " alt=''> \
								<h2> \
						            <b>" + data[index].name + "</b> \
						        </h2> \
								<span class='ico symbol'>e</span> \
						        </li>";
					index++;
				}
				innerHTML += "</ul>";
			}
			return innerHTML;
		};

		AudioList.prototype.registEventHandleOnSlideCtrl = function(){
			//assing handler			
			$("#slide li").click(function(){
				var i = $(this).find("img").attr("src");
				//set background
				$("#bg").css("background-image","url("+i+")");

				//set selected item on landscape
				$("#slide li").removeClass("on");
				$(this).addClass("on");
				$("#slide ul").removeClass("on");
				$(this).parent().addClass("on");

				//set selected item's title on landscape
				$("#selectedTitle").text($(this).attr("data_title"));

				//set audio tag source
				$("#player").attr("src", $(this).attr("data_path").replace("`", "'"));

				//set footer play button
				$("#footer .wrap .play").text("e");

				//set footer title
				$("#footer .wrap .title > h3").text($(this).attr("data_title"));
				//$("#footer .wrap .title > p").text("Artist");

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

		AudioList.prototype.onReadAudioList = function(data){
			//set HTML for landscape
			var innerHTML = this.getInnerHTML(data);
			$("#slide .scroll").append(innerHTML);
			$("#selectedTitle").text(data[0].name);
			$("#bg").css("background-image","url("+data[0].thumb+")");
			$("#player").attr("src", data[0].path);
			//set footer title
			$("#footer .wrap .title > h3").text(data[0].name);
			//set time
			var audio = document.getElementById("player");
			audio.addEventListener("loadedmetadata", function(){
				//display time when metadata loaded
				$("#footer .wrap .time_end").text(formatSecondsAsTime(this.duration));
			});

			this.registEventHandleOnSlideCtrl();

			this.refreshScroll();
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
