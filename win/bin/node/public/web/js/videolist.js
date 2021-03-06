( function(){
	var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

	VideoList = (function(){
		function VideoList(root){
			this.$root = $(root);			
			this.filelist = [];
			this.iscroll;
			this.deviceType;
			this.init();
		    this.readVideoList();
		};

		VideoList.prototype.init = function(){
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

		VideoList.prototype.getDisplayStatus = function(){
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

		VideoList.prototype.registEventHandler = function(){

			$("#header .back").click(function(){
			 	$(location).attr('href', "index.html");
			});

	  		$("#footer .wrap .prev").click(__bind(function(){
				this.playPrev();
			}, this));
			
			$("#content .prev").click(__bind(function(){
				this.playPrev();
			}, this));
			
			$("#footer .wrap .next").click(__bind(function(){
				this.playNext();
			}, this));
			
			$("#content .next").click(__bind(function(){
				this.playNext();
			}, this));

			$("#footer .wrap .play").click(__bind(function(){
				this.play();	
			}, this));				
		};

		VideoList.prototype.play = function(){
			
			if($("#footer .wrap .play").text() == "d"){
				//pause
				$("#footer .wrap .play").text("e");
			}
			else if($("#footer .wrap .play").text() == "e"){
				//play
				//do not set to "d" for returning from video player.
				//$(this).text("d");
				$(location).attr('href', $("#footer .wrap .title > p").attr("href"));
			}
		};
		

		VideoList.prototype.playNext = function(){		
  			var next = $("#slide .scroll .on .on").next();
  		
  			if(next.length <= 0){
  				if( $("#slide .scroll .on").next().length > 0 ){
  					next = $("#slide .scroll .on").next().children().first();
  				}else{
  					next = $("#slide .scroll ul:first-child li:first-child");
  				}
  			}	  					
  		
  			next.click();
  			
  			this.iscroll.scrollToElement("#slide li.on", 100);
  			this.refreshScroll();
  		};

		VideoList.prototype.playPrev = function(){		
  			var prev = $("#slide .scroll .on .on").prev();
  		
  			if(prev.length <= 0){
  				if( $("#slide .scroll .on").prev().length > 0 ){
  					prev = $("#slide .scroll .on").prev().children().last();
  				}else{
  					prev = $("#slide .scroll ul:last-child li:last-child");
  				}
  			}	  					
  		
  			prev.click();

  			this.iscroll.scrollToElement("#slide li.on", 100);
  			this.refreshScroll();
		};

		VideoList.prototype.scrollset = function(){
			this.iscroll = new iScroll('slide', {
				snap:false,
				hScrollbar: false,
				vScrollbar: false,
				momentum: true,		
				bounce: true,		
				lockDirection :true
			});
		};

		VideoList.prototype.onError = function(req, status, error){
		//onError
		//no contents display
			$(".nocontent").ready(function(){
				$("#slide").css("display", "none");
				$("div.prev, div.next").css("display", "none");
			});					
			var innerHTML = "<div class='nocontent'>\
								<div class='nolist'>재생할 콘텐츠가 없습니다</div>\
								<div id='bg' class='video'>\
							</div>";			
			$("#slide").parent().append(innerHTML);		
		};

		VideoList.prototype.getInnerHTML = function(data, type){
			var innerHTML = "";
			var index = 0;
			for(var i=0; i<data.length/5; i++){
				if(index == 0)
					innerHTML += "<ul class='on'>";
				else
					innerHTML += "<ul>";
				for(var j=0; j<5 && index<data.length; j++){
					if(data[index].duration) {
						if(index == 0)
							innerHTML += "<li class='on' data_title=\""+ data[index].name +"\" data_path=\""+ data[index].path +"\" data_duration=\""+ data[index].duration +"\">";
						else
							innerHTML += "<li data_title=\""+ data[index].name +"\" data_path=\""+ data[index].path +"\" data_duration=\""+ data[index].duration +"\">";
					}
					else {
						if(index == 0)
							innerHTML += "<li class='on' data_title=\""+ data[index].name +"\" data_path=\""+ data[index].path +"\">";
						else
							innerHTML += "<li data_title=\""+ data[index].name +"\" data_path=\""+ data[index].path +"\">";
					}

					innerHTML += "<img src=\"" + data[index].thumb + "\" alt=''> \
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

		VideoList.prototype.registEventHandleOnSlideCtrl = function(){
			//assing handler
			$("#slide li").click(function(){
				var i = $(this).find("img").attr("src");
				//set background
				$("#bg").css("background-image","url(\""+i+"\")");

				//set selected item on landscape
				$("#slide li").removeClass("on");
				$(this).addClass("on");
				$("#slide ul").removeClass("on");
				$(this).parent().addClass("on");

				//set selected item's titme on landscape
				$("#selectedTitle").text($(this).attr("data_title"));

				//set footer play button
				$("#footer .wrap .play").text("e");

				//set footer title
				$("#footer .wrap .title > h3#first").text($(this).attr("data_title"));
				if($(this).attr("data_duration")) {
					$("#footer .wrap .title > h3#second").text("< Time: " + $(this).attr("data_duration") + " >");
				}
				$("#footer .wrap .title > p").attr("href", $(this).attr("data_path"));
			});	
		};

		VideoList.prototype.refreshScroll = function(){
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
		};

		VideoList.prototype.onReadVideoList = function(data){
			if(data.length == 0){
				//no contents display
				$(".nocontent").ready(function(){
					$("#slide").css("display", "none");
					$("div.prev, div.next").css("display", "none");
				});					
				var innerHTML = "<div class='nocontent'>\
									<div class='nolist'>재생할 콘텐츠가 없습니다</div>\
									<div id='bg' class='video'>\
								</div>";			
				$("#slide").parent().append(innerHTML);				
			} else {
				//set HTML for landscape
				var innerHTML = this.getInnerHTML(data);
				$("#slide .scroll").append(innerHTML);
				$("#selectedTitle").text(data[0].name);
				$("#bg").css("background-image","url(\""+data[0].thumb+"\")");

				//set footer title
				$("#footer .wrap .title > h3#first").text(data[0].name);
				if(data[0].duration) {
					$("#footer .wrap .title > h3#second").text("< Time: " + data[0].duration + " >");
				}
				$("#footer .wrap .title > p").attr("href", data[0].path);

				this.registEventHandleOnSlideCtrl();

				this.refreshScroll();
			}
		};

		VideoList.prototype.readVideoList = function(){
			var vl = this;

			if($("#header .wrap h1").text() == "Video")
				ajaxUrl = "getVideoList";
			else if($("#header .wrap h1").text() == "Dropbox Video")
				ajaxUrl = "getDropboxVideoList";

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
					__bind(vl.onReadVideoList(data), vl);
				}				
			});
		};



		return VideoList;
	})();

	$(function(){	    
	    return new VideoList();
	});

}).call(this);
