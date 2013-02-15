$(function(){	
	//#test {position:absolute; right:0; bottom:0; font-size:12px; padding:10px; color:#ff3333; z-index:1000;}
	//<div id="test"><span id="width"></span>px * <span id="height"></span>px</div>
	$("#width").text($(window).width()); 
	$("#height").text($(window).height());		
	function scroll_set(){
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
		/*
		if(ww > 1100 && hh < 768){//tv
			$("#slide .scroll").width($("#slide li").length * 170+"px");		
			$("#slide ul").width(850+"px");
		}
		*/
		var iscroll = new iScroll('slide', {
			snap:false,
			hScrollbar: false,
			vScrollbar: false,
			momentum: true,		
			bounce: true,		
			lockDirection :true
		});	
		$('.time_control input').slideControl();		
	}		
	scroll_set();
	$(window).resize(function(){
		scroll_set();
		$("#width").text($(window).width()); 
		$("#height").text($(window).height());	
	});	
	
	$(".sound_s_ico").click(function(){
		$(this).find("span").toggleClass("on");	
		$(".sound_s").toggle();
	});
	$("#slide li,#slide_tv li,.list li").click(function(){				
		$("#content .title h2 strong").text($(this).find("h2 b").text());
		$("#content .title p").text($(this).find("h2 span").text());
		var i = $(this).find("img").attr("src");
		$("#bg").css("background-image","url("+i+")");	
		$("#slide li,#slide_tv li,.list li").removeClass("on");
		$(this).addClass("on");		
		$("#slide ul").removeClass("on");
		$(this).parent().addClass("on");		
	});	
	$("#main li.audio").click(function(){
		$("body").attr("class","audio");
		$("#main").hide();
		$("#wrap").show();
		$("#header h1").text("Music");		
		scroll_set();
	});
	$("#main li.video").click(function(){
		$("body").attr("class","video");
		$("#main").hide();
		$("#wrap").show();
		$("#header h1").text("Video");
		scroll_set();
	});	
	$("#header .back").click(function(){
		$("body").attr("class","");
		$("#main").show();
		$("#wrap").hide();
	});
})(jQuery);