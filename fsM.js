var M = require('asyncm');

var fs = require('fs');

['readdir', 'lstat', 'realpath'].forEach(function(name) {
	exports[name] = wrapSingleFs(name);
});

['open', 'read'].forEach(function(name) {
	exports[name] = wrap(name);
});

function wrapSingleFs(name) {
	return function(arg) {
		return new M(function(result, error) {
			fs[name].call(fs, arg, function(err) {
				if (err) error(err);
				else result.apply(null, Array.prototype.slice.call(arguments, 1));
			});
		});
	};
}

function wrap(name) {
	return function() {
		let args = arguments;

		return new M(function(result, error) {
			fs[name].apply(fs, Array.from(args).concat(function(err) {
				if (err) error(err);
				else result.apply(null, Array.prototype.slice.call(arguments, 1));
			}));
		});
	};
}
