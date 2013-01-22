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
			$(location).attr('href', event.currentTarget.attributes.href.nodeValue);
		};

		VideoList.prototype.onReceiveItemImage = function(data){
			if(data && data.picture){
				var src = "data:image/jpg;base64," + data.picture.toString();
				$("#" + data.selectedVideoId).attr("src", src);
				$("#" + data.selectedVideoId).attr("width", "128");
				$("#" + data.selectedVideoId).attr("height", "128");
				$("#" + data.selectedVideoId).attr("isThumbTried", "yes");
			}
		}

		VideoList.prototype.onLoadItemImage = function(event){
			console.log(event);
			var vl = this;

			var selectedImg = event.currentTarget;
			if (selectedImg && (selectedImg.attributes.isThumbTried.nodeValue == 'no')){
				//get video file path
				var div = selectedImg.parentNode;
				var filepath = div.id;
				if (filepath.length > 0){
					$.ajax({
						type : "POST"
						, async : true
						, url : "getVideoThumbnail"
						, data : {path : filepath, selectedVideoId : selectedImg.id}
						, dataType : "json"
						, timeout : 3000
						, cache : false
						, contentType : "application/x-www-form-urlencoded; charset=UTF-8"
						, error : function(req, error){
							__bind(vl.onError(req, status, error), vl);
						}				
						, success : function(data){
							__bind(vl.onReceiveItemImage(data), vl);
						}				
					});
				}
			}
		};

		VideoList.prototype.onReadVideoList = function(data){ 			
			for(var i=0; i<data.length; i++){
				var item = data[i];
			     	var iconId = item.path;

				var innerHTML = " \
					<li href=\"" + item.path + "\" id=innerItem" + String(i) + " class= bg-color-blueDark fg-color-white> \
						<div class='icon' id=\"" + iconId + "\"> \
							<img isThumbTried='no' id=innerItemImage" + String(i) + " src='images/video128.png' /> \
						</div> \
						<div class='data' id=\"" + item.path + "\"> \
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
