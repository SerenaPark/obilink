( function(){
	var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

	var AudioList;
	AudioList = (function(){
		function AudioList(root){
			this.$root = $(root);
			this.filelist = [];
		    this.readAudioList();
		};

		AudioList.prototype.onError = function(req, status, error){
			//alert("code : " + req.status + "\r\nmessage : " + req.reponseText);
			console.log("code : " + req.status + "\r\nmessage : " + req.reponseText);
		};

		AudioList.prototype.onMouseClickList = function(event){
			console.log(event);
		};

		AudioList.prototype.onReceiveItemImage = function(data){
			if(data && data.picture){
				var src = "data:image/jpg;base64," + data.picture.toString();
				$("#" + data.selectedAudioId).attr("src", src);
				$("#" + data.selectedAudioId).attr("width", "128");
				$("#" + data.selectedAudioId).attr("height", "128");
			}
		}

		AudioList.prototype.onLoadItemImage = function(event){
			var vl = this;

			var selectedImg = event.currentTarget;
			if (selectedImg){
				//get audio file path
				var div = selectedImg.parentNode;
				var filepath = div.id;
				if (filepath.length > 0){
					$.ajax({
						type : "POST"
						, async : true
						, url : "getAudioThumbnail"
						, data : {path : filepath, selectedAudioID : selectedImg.id}
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

		AudioList.prototype.onReadAudioList = function(data){ 			
			for(var i=0; i<data.length; i++){
		     	var item = data[i];
		     	var innerHTML = "<li id=innerItem" + String(i) + " class= bg-color-pinkDark fg-color-white> \
                         		<div class='icon' id='" + item.path + "'> \
                             		<img id=innerItemImage" + String(i) + " src='images/music128.png' /> \
		                        </div> \
                         		<div class='data' id='" + item.filewebpath + "'> \
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
	    return new AudioList("#listview image fluid");
	});

}).call(this);
