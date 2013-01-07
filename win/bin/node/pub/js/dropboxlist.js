( function(){
	//function bind
	var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

	//Private Cloud Dropbox
	var PCDropbox;	
	PCDropbox = (function(){
		function PCDropbox(dbClient, root){
			this.dbClient = dbClient;
			this.$root = $(root);
			this.filelist = [];
			this.dbClient.authenticate(__bind(function(error, data) {
		        if (error) {
		        	console.log("error");
		        	return;
		          //return this.showError(error);
		        }

		        this.dbClient.getUserInfo(__bind(function(error, userInfo) {
		          	if (error) {
		            	return; //this.showError(error);
		          	}
		          	return $('#userinfo').text("user-name : " + userInfo.name);
		          	//console.log("username : " + userInfo.name);
		          	//return ;
		        }, this));
		    }, this));

		    this.readRemoteDir();
		}

		PCDropbox.prototype.readRemoteDir = function(){
			this.dbClient.readdir("/", __bind(function(err, list, stat, entry_stat){
				for (var i=0; i<entry_stat.length; i++){
					//case of files
					if (entry_stat[i].isFile){
						if (this.getExtType(entry_stat[i].name).length > 0){
							this.filelist.push(entry_stat[i].name);

							$(".list").append($("<li>", {
								click: __bind(function(event){
									return __bind( this.onClickContents(event), this);
								},this),
								class: entry_stat[i].path
							}).append($("<a>", {
							})).append($("<img>", {
								src: "img/ico_video.png",
								alt: "",
								class: entry_stat[i].path,
								load: __bind(function(event){
									return __bind(this.onLoadedThumnail(event), this);
								},this)
							})).append($("<h2>", {
								text: entry_stat[i].name
							})));
						}
					}
				}
	 		}, this));
		};

		PCDropbox.prototype.onClickContents = function(event){
			if (event.currentTarget.innerText.length > 0)
				alert(event.currentTarget.className);
		};

		PCDropbox.prototype.onLoadedThumnail = function(event){
			//load thumnail
			var type = this.getExtType(event.currentTarget.className);
			if(type == "video")
				event.currentTarget.src = "img/ico_video.png";
			else if(type == "audio")
				event.currentTarget.src = "img/ico_audio.png";				
			else if(type == "pic"){}
			else{}
			//  this.dbClient.readThumbnail(event.currentTarget.className, null, __bind(function(err, data, metadata){
			//  	if (err){
			// 		var type = this.getExtType(event.currentTarget.className);
			// 		if(type == "video")
			// 			event.currentTarget.src = "img/ico_video.png";
			// 		else if(type == "audio")
			// 			event.currentTarget.src = "img/ico_audio.png";				
			// 		else if(type == "pic"){}
			// 		else{}
			// 		return;
			//  	}

			//  	event.currentTarget.src = "data:image/jpeg;base64," + data;
			// }, this));
		};

		PCDropbox.prototype.getExtType = function(filename){
			if ( (filename.indexOf(".") < 0) || (filename.length <= 0) )
				return "";

			var ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
			if (ext.length < 0)
				return "";

			if ( (ext == "avi") || (ext == "mp4") ){
				return "video";
			}
			else if(ext == "mp3"){
				return "audio";
			}
			else if( (ext == "jpeg") || (ext == "jpg") || (ext == "gif") ){
				return "pic";
			}

			return "";
		};

		return PCDropbox;
	})();

	$(function(){
		//create dropbox client
    	var client = new Dropbox.Client({
	      key: '9x2f2jw3z4gwn1c',
	      secret: '836083l5m8uargp',
	      sandbox: true
	    });
	    //set authDriver
	    client.authDriver(new Dropbox.Drivers.Redirect({
	      rememberUser: true
	    }));
	    
	    return new PCDropbox(client, "#media");
	});

}).call(this);

	// var dbClient;
	// var mediaFilesList = [];

	// function readDropboxDir(path){
	// 	dbClient.readdir(path, function(err, list, stat, entry_stat){
	// 		var recur = arguments.callee;

	// 		for(var i=0; i<entry_stat; i++){
	// 			if(entry_stat[i].isFolder){
	// 				recur(entry_stat[i].path);
	// 			}
	// 			else if(entry_stat[i].isFile){
	// 				mediaFilesList.push(entry_stat[i].name);
	// 			}
	// 		}
	// 	});
	// }

	// $(document).ready(function(){
	// 	dbClient = new Dropbox.Client({
	// 		key: "9x2f2jw3z4gwn1c", secret: "836083l5m8uargp", sandbox: true
	// 	});
	// 	console.log(dbClient);

	// 	dbClient.authDriver(new Dropbox.Drivers.Redirect({
	// 		rememberUser: true
	// 	}));

	// 	dbClient.authenticate(function(error, client) {
	// 		if(error){
	// 			console.log("dropbox authenticate failed"); 	 						
	// 		}
	// 	});

	// 	dbClient.readdir("/", function(err, list, stat, entry_stat){
	// 		if(err){
	// 			alert("Failed dropbox directory");
	// 		}
	// 		console.log(list);
	// 	});	
	// });