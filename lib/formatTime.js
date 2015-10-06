(function() {
	'use strict';

	module.exports = function(seconds){
		var response = [];
		var weeks = Math.floor(seconds / (3600 * 24 * 7));
		seconds -= weeks * (3600 * 24 * 7);
		if(weeks){
			response.push(weeks + ' week' + (weeks!=1 ? 's' : ''));
		}
		var days = Math.floor(seconds / (3600 * 24));
		seconds -= days * (3600 * 24);
		if(days){
			response.push(days + ' day' + (days!=1 ? 's' : ''));
		}
		var hours = Math.floor(seconds / (3600));
		seconds -= hours * (3600);
		if(hours){
			response.push(hours + ' hour' + (hours!=1 ? 's' : ''));
		}
		var minutes = Math.floor(seconds / (60));
		seconds -= minutes * (60);
		if(minutes){
			response.push(minutes + ' minute' + (minutes!=1 ? 's' : ''));
		}

		response.push(seconds + ' second' + (seconds!=1 ? 's' : ''));

		return response.join(', ');
	};
})();