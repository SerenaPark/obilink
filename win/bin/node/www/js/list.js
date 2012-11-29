$(document).ready(function(){
	$.ajax({
	    type : "GET" //"POST", "GET"
	    , async : true //true, false
	    , url : "tedTest" //Request URL
	    , dataType : "json" //전송받을 데이터의 타입
	                               //"xml", "html", "script", "json" 등 지정 가능
	                               //미지정시 자동 판단
	    , timeout : 3000 //제한시간 지정
	    , cache : false  //true, false
	    // , data : $("#inputForm").serialize() //서버에 보낼 파라메터
	    //                  //form에 serialize() 실행시 a=b&c=d 형태로 생성되며 한글은 UTF-8 방식으로 인코딩
	    //                  //"a=b&c=d" 문자열로 직접 입력 가능
	    , contentType: "application/x-www-form-urlencoded; charset=UTF-8"
	    , error : function(request, status, error) {
	     	//통신 에러 발생시 처리
	     	alert("code : " + request.status + "\r\nmessage : " + request.reponseText);
	    }
	    , success : function(response, status, request) {
	     	//통신 성공시 처리
	     	alert("success");
	    }
	    , beforeSend: function() {
	     	//통신을 시작할때 처리
	     	//$('#ajax_indicator').show().fadeIn('fast'); 
	    }
	    , complete: function() {
	     	//통신이 완료된 후 처리
	     	//$('#ajax_indicator').fadeOut();
	    }
	});
});
