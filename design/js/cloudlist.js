( function(){
	var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

	var DropboxList;
	DropboxList = (function(){
		function DropboxList(root){
			this.$root = $(root);
			this.filelist = [];
		    this.readDropboxList();
		};

		DropboxList.prototype.onError = function(req, status, error){
			alert("code : " + request.status + "\r\nmessage : " + request.reponseText);
		};

		DropboxList.prototype.onMouseClickList = function(event){
			console.log(event);
		};

		DropboxList.prototype.onLoadItemImage = function(event){
			console.log(event);
		};

		DropboxList.prototype.onReadDropboxList = function(data){ 			
			for(var i=0; i<data.length; i++){
		     	var item = data[i];
		     	var innerHTML = "<li id=innerItem" + String(i) + " class= bg-color-blueDark fg-color-white> \
                         		<div class='icon'> \
                             		<img id=innerItemImage" + String(i) + " src='images/video128.png' /> \
		                        </div> \
                         		<div class='data'> \
                             		<h2 class='fg-color-white'>" + item.filename + "</h2> \
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

		DropboxList.prototype.readDropboxList = function(){
			var vl = this;

			$.ajax({
				type : "GET"
				, async : true
				, url : "getDropboxList"
				, dataType : "json"
				, timeout : 3000
				, cache : false
				, contentType : "application/x-www-form-urlencoded; charset=UTF-8"
				, error : function(req, error){
					__bind(vl.onError(req, status, error), vl);
				}				
				, success : function(data){
					__bind(vl.onReadDropboxList(data), vl);
				}				
			});
		};



		return DropboxList;
	})();

	$(function(){	    
	    return new DropboxList("#listview image fluid");
	});

}).call(this);
