$(document).ready(function(){
	var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

	$.ajax({
	    type : "GET"
	    , async : true
	    , url : "getPictureList"
	    , dataType : "json"
	    , timeout : 3000
	    , cache : false
	    , contentType: "application/x-www-form-urlencoded; charset=UTF-8"
	    , error : function(request, status, error) {
	     	alert("code : " + request.status + "\r\nmessage : " + request.reponseText);
	    }
	    , success : function(res, status, req) {
	     	for(var i=0; i<res.length; i++){
	     		var item = res[i];

	     		$(".list_pic").append($("<li>", {
					click: __bind(function(event){
						//return __bind( this.onClickContents(event), this);
						return;
					},this)
					//class: entry_stat[i].path
				}).append($("<img>", {
					src: "img/list1.png",
					alt: " ",
					//class: entry_stat[i].path,
					load: __bind(function(event){
						//return __bind(this.onLoadedThumnail(event), this);
						return;
					},this)
				})).append($("<a>", {
				 	href: "picture.html"
				})).append($("<h2>", {
					text: item.filename
				})));
				// }).append($("<a>", {
				// 	href: "picture.html"
				// })).append($("<img>", {
				// 	src: "img/list1.png",
				// 	alt: "",
				// 	//class: entry_stat[i].path,
				// 	load: __bind(function(event){
				// 		//return __bind(this.onLoadedThumnail(event), this);
				// 		return;
				// 	},this)
				// })).append($("<h2>", {
				// 	text: item.filename
				// })));
	     	}
	    }
	});
});
