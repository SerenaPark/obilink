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
		};

		VideoList.prototype.getDisplayStatus = function(){
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

		VideoList.prototype.registEventHandler = function(){

			$("#header .back").click(function(){
			 	$(location).attr('href', "index.html");
			});
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
			//alert("code : " + req.status + "\r\nmessage : " + req.reponseText);
			console.log("code : " + req.status + "\r\nmessage : " + req.responseText);
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

		VideoList.prototype.registEventHandleOnSlideCtrl = function(){
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

				//set selected item's titme on landscape
				$("#selectedTitle").text($(this).attr("data_title"));

				//set audio tag source
				$("#player").attr("src", $(this).attr("data_path"));
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
			//set HTML for landscape
			var innerHTML = this.getInnerHTML(data);
			$("#slide .scroll").append(innerHTML);
			$("#selectedTitle").text(data[0].name);
			$("#bg").css("background-image","url("+data[0].thumb+")");

			this.registEventHandleOnSlideCtrl();

			this.refreshScroll();
		};

		VideoList.prototype.readVideoList = function(){
			var vl = this;

			$.ajax({
				type : "GET"
				, async : true
				, url : "getVideoList"
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
