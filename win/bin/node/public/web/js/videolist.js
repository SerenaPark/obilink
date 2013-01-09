( function(){
	var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

	var VideoList;
	VideoList = (function(){
		function VideoList(root){
			this.$root = $(root);
			this.filelist = [];
		    this.readVideoList();
		};

		VideoList.prototype.onError = function(req, status, error){
			alert("code : " + request.status + "\r\nmessage : " + request.reponseText);
		};

		VideoList.prototype.onMouseClickList = function(event){
			console.log(event);
		};

		VideoList.prototype.onLoadItemImage = function(event){
			console.log(event);
		};

		VideoList.prototype.onReadVideoList = function(data){ 			
			for(var i=0; i<data.length; i++){
		     	var item = data[i];
		     	var innerHTML = "<li id=innerItem" + String(i) + " class= bg-color-blueDark fg-color-white> \
                         		<div class='icon'> \
                             		<img id=innerItemImage" + String(i) + " src='images/video128.png' /> \
		                        </div> \
                         		<div class='data'> \
                             		<h2 class='fg-color-white'>" + item.name + "</h2> \
                         		</div> \
                     			</li>";

		     	$(".listview").append(innerHTML);

		     	//Add New Click Event
		     	$("#innerItem" + i).live("click", __bind( function(event){
	     			this.onMouseClickList(event);
	     		}, this));

	     		//Add New onLoadImage Event
		     	$("#innerItemImage" + i).load( __bind( function(event){
	     			this.onLoadItemImage(event);
	     		}, this));
			}
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
	    return new VideoList("#listview image fluid");
	});

}).call(this);
