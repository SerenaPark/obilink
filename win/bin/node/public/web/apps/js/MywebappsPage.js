var MywebappsP = {};

(function(q) {
	var self = q;
	q.ID = 'mywebapps';
	q.scroll = null;

	initMyApps();

// 	Controller.subscribe(Controller.MSG_ON_START, onMsg);
// 	Controller.subscribe(Controller.MSG_ON_STOP, onMsg);
// 	Controller.subscribe(Controller.MSG_EDIT, onMsg);
// 	Controller.subscribe(Controller.MSG_DONE, onMsg);
// 	Controller.subscribe(Controller.MSG_DELETE, onMsg);
	  
//     function onMsg(msg, args) {
//     	switch(msg) {
//     		case Controller.MSG_ON_START: {
//     			if (self.ID == args.page) {
// 				$('section#mywebapps_page').removeClass('edit');
				
// 				var id = cookieJar.getId();
// 				$('section#mywebapps_page #title #name').text(id.toUpperCase());
//     				initMyApps();
//     			}
//     			break; 
// 	    	}
// 	    	case Controller.MSG_ON_STOP: {
//     			if (self.ID == args.page) {
    				
//     			}
//     			break; 
// 	    	}
// 	    	case Controller.MSG_EDIT: {
// 			$('section#mywebapps_page').addClass('edit');
// 			$('section#mywebapps_page .check').removeClass('checked').off('click').on('click', function() {
// 				$(this).toggleClass('checked');
// 			});
// 			$('section#mywebapps_page #sortable').sortable('enable');
// 			$( "#sortable" ).disableSelection();
//     			break; 
// 	    	}
// 	    	case Controller.MSG_DELETE: {
// 			Controller.publish(Controller.MSG_ON_DELETE_BOX, {'page':DelBoxP.ID, 
// 						onConfirm: function(){
// 							$('section#mywebapps_page .check.checked').each(function() {
// 								$(this).parent().remove();
// 								deleteMyApp($(this).parent().attr('id'));
// 							})
// 						}});
//     			break; 
// 	    	}
// 	    	case Controller.MSG_DONE: {
// 			$('section#mywebapps_page').removeClass('edit');
// //			$('section#mywebapps_page #sortable').sortable('refreshPosition');
// 			$('section#mywebapps_page #sortable').sortable('disable');
//     			break; 
// 	    	}
// 	 	}
//     }

function initMyApps() {
	myBasket.list(function(apps) {
			var html = '';
			var sortable = $('section#mywebapps_page #sortable');
			for (i=0; i<apps.length; ++i) {
				html += '<div id="' + apps[i].id + '" class="app">';
				html += '<div class="check"></div>';
				if(storeOption.useLauncher())
					html += '<a href="'+location.href+'index.php/launch/' + apps[i].id + '" target="_blank">';
				else
					html += '<a href="' + apps[i].index_url + '">';
				var uri = encodeURI(apps[i].icon);
				html += '<div class="icon" style="background-image:url(' + uri + ')"></div>';
				html += '</a>';
				html += '<div class="title">' + apps[i].title + '</div>';
				html += '</div>';
			}
			sortable.html(html);
/*			for (i=0; i<apps.length; ++i) {
				var li = $(document.createElement('li')).attr('id', apps[i].id).addClass('app');
				li.append($(document.createElement('div')).addClass('check'));
				li.append($(document.createElement('a')).attr('href', location.href+'index.php/launch/'+apps[i].id).attr('target','_blank')
						.append($(document.createElement('div')).addClass('icon').css('background-image:url('+apps[i].icon+')'))
				);
				li.append($(document.createElement('div')).addClass('title').text(apps[i].title));
				sortable.append(li);
			}*/
			sortable.sortable({
				sort: function(event, ui) {  },
				change: function(event, ui) { /*console.dir(event); console.dir(ui); */},
				stop:  function(event, ui) { console.dir(event); console.dir(ui); }
			});
			sortable.sortable('disable');
			console.info($(window).height());
			var wrapper = $('#mywebapps_scroll_wrapper');
			if(!wrapper.clientHeight){
				self.wpos = wrapper.position().top + $('section#mywebapps_page .container').position().top;
				wrapper.height($(window).height() - self.wpos);
			}
			if(!MywebappsP.scroll) {
				MywebappsP.scroll = new iScroll('mywebapps_scroll_wrapper', {hideScrollbar:true});
				$(window).resize(function(){
					wrapper.height($(window).height() - MywebappsP.wpos);
				});
			} else {
				MywebappsP.scroll.refresh();
				MywebappsP.scroll.scrollTo(0, 0, 0);
			}
		},
		function(msg) {
			console.dir('ERROR ' + msg);
		}
	);	
}

function refreshScroll(){
}

function deleteMyApp(id) {
	myBasket.remove(id, function(msg) {
			console.dir(msg);
		},
		function(msg) {
			console.dir('ERROR ' + msg);
		}
	);	
}
}(MywebappsP));
