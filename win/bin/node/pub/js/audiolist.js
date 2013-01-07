$(document).ready(function(){
	$.ajax({
	    type : "GET"
	    , async : true
	    , url : "getAudioList"
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
	     		var li = document.createElement("li");
	     		
	     		var img = document.createElement("img");
	     		img.setAttribute("src", "img/ico_audio.png");
	     		img.setAttribute("alt", "");
	     		li.appendChild(img);

	     		var h2 = document.createElement("h2");
	     		h2.innerText = item.filename;
	     		li.appendChild(h2);

	     		$('.list').append(li);
	     	}
	    }
	});
});
