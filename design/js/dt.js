$(document).ready(function(){
	// $.ajax({
	//     type : "GET"
	//     , async : true
	//     , url : "dropboxTest"
	//     , dataType : "json"
	//     , timeout : 3000
	//     , cache : false
	//     , contentType: "application/x-www-form-urlencoded; charset=UTF-8"
	//     , error : function(request, status, error) {
	//      	alert("code : " + request.status + "\r\nmessage : " + request.reponseText);
	//     }
	//     , success : function(res, status, req) {
	//     	alert("success");
	//     }
	// });
});

$("#authen").click(function(e) {
	$.ajax({
	    type : "GET"
	    , async : true
	    , url : "drop_autenticate"
	    , cache : false
	    , contentType: "application/x-www-form-urlencoded; charset=UTF-8"
	    , timeout: 3000
	    , error : function(request, status, error) {
	     	//alert("code : " + request.status + "\r\nmessage : " + request.reponseText);
	     	if(status == "timeout")
	     		console.log("timeout");
	    }
	    , success : function(res, status, req) {
	    	//alert("success");
	    	console.log("success");
	    }
	});
});

$("#getlist").click(function(e) {
	$.ajax({
	    type : "GET"
	    , async : true
	    , url : "drop_getFileList"
	    , cache : false
	    , contentType: "application/x-www-form-urlencoded; charset=UTF-8"
	    , error : function(request, status, error) {
	     	//alert("code : " + request.status + "\r\nmessage : " + request.reponseText);
	     	if(status == "timeout")
	     		console.log("timeout");
	    }
	    , success : function(res, status, req) {
	    	//alert("success");
	    	console.log("success");
	    }
	});
});