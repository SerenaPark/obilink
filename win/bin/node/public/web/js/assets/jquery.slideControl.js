//Examples at http://nikorablin.com/slideControl
(function($){
	$.fn.slideControl = function(options) {
		var defaults = {
			speed: 0,
			lowerBound: 0,
			upperBound: 10
		};
		var options = $.extend(defaults, options);		
		return this.each(function() {
			var o = options;
			var controller = false;
			var position = 0;
			var obj = this;
			var parent = $(this).parent();
			parent.html("<div class=\"time_line\"><strong style=\"width:" + $(obj).val()*10 + "%\"><b class=\"symbol\">c</b></strong></div>" + $(obj).wrap("<span></span>").parent().html());
			var container = parent.parent().parent().find('.time_control');
			var fill = container.find('strong');
			var handle = fill.find('b');
			var input = parent.find('input');
			var containerWidth = container.outerWidth() + 1;
			var handleWidth = $(handle).outerWidth();
			var offset = $(container).offset();
			var animate = function(value){$(fill).animate({ width: value + "%"}, o.speed);}			
			$(window).resize(function() {
				offset = $(container).offset();				
			});
			$(container).click(function(e) {
				e.preventDefault();
				position = checkBoundaries(Math.round(((e.pageX - offset.left + handleWidth/2)/containerWidth)*100));				
				animate(position);
				$(input).val(position/10);
			});	
			$(handle).mousedown(function(e) {
				e.preventDefault();
				controller = true;
				$(document).mousemove(function(e) {
					e.preventDefault();
					position = checkBoundaries(Math.round(((e.pageX - offset.left + handleWidth/2)/containerWidth)*100));
					if (controller) {	
						$(fill).width(position + "%");
						$(input).val(position/10);
					}
				});
				$(document).mouseup(function() {
					e.preventDefault();
					controller = false;
				});
			});
			$(input).change(function() {
				var value = checkBoundaries($(this).val()*10);
				if ($(this).val() > o.upperBound)
					$(input).val(o.upperBound);
				else if ($(this).val() < o.lowerBound)
					$(input).val(o.lowerBound);
				animate(value);
			});			
		});
		function checkBoundaries(value) {
			if (value < options.lowerBound*10)
				return options.lowerBound*10;
			else if (value > options.upperBound*10)
				return options.upperBound*10;
			else
				return value;
		}
	}	
})(jQuery);