( function(){
	var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

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

	  		$("#footer .wrap .prev").click(function(){
				console.log("prev");
			});
			$("#footer .wrap .next").click(function(){
				console.log("next");
			});

			$("#footer .wrap .play").click(function(){
				if($(this).text() == "d"){
					//pause
					$(this).text("e");
					$("#player").trigger("pause");
				}
				else if($(this).text() == "e"){
					//play
					$(this).text("d");
					$("#player").trigger("play");
				}
			});	
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
						innerHTML += "<li class='on' data_title='"+ data[index].name +"' data_path='"+ data[index].path +"'>";
					else
						innerHTML += "<li data_title='"+ data[index].name +"' data_path='"+ data[index].path +"'>";

					innerHTML += "<img src=" + data[index].thumb + " alt=''> \
								<h2> \
						            <b>" + data[index].name + "</b> \
						            <span>Macklemore Ryan Lewis Featuring Wanz - The Heist</span> \
						        </h2> \
						        <span class='time'>5:12</span> \
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
				$("#player").attr("src", $(this).attr("data_path"));

				//set footer play button
				$("#footer .wrap .play").text("e");

				//set footer title
				$("#footer .wrap .title > h3").text($(this).attr("data_title"));
				$("#footer .wrap .title > p").text("Artist");

				//set time
				//$("footer .wrap .time_start").attr($("player").trigger("currenttime"));
				//$("footer .wrap .time_end").attr($("player").trigger("duration"));
			});	
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
			$('.time_control input').slideControl();
		};

		AudioList.prototype.onReadAudioList = function(data){
			//set HTML for landscape
			var innerHTML = this.getInnerHTML(data);
			$("#slide .scroll").append(innerHTML);
			$("#selectedTitle").text(data[0].name);
			$("#bg").css("background-image","url("+data[0].thumb+")");
			// $("#bg").css("background-image","url(" + data[0].thumb + ") \
			// 	no-repeat; \
			// 	background-size:cover; \
			// 	background-position:50% 50%;");
			$("#player").attr("src", data[0].path);
			//set footer title
			$("#footer .wrap .title > h3").text(data[0].name);
			$("#footer .wrap .title > p").text("Artist");

			//$("footer .wrap .time_start").();
			//$("footer .wrap .time_end").();

			this.registEventHandleOnSlideCtrl();

			this.refreshScroll();
		};

		AudioList.prototype.readAudioList = function(){
			var vl = this;

			$.ajax({
				type : "GET"
				, async : true
				, url : "getAudioList"
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
