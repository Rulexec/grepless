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
		return new M(function(callback) {
			fs[name].call(fs, arg, callback);
		});
	}
}

function wrap(name) {
	return function() {
		let args = arguments;

		return new M(function(callback) {
			fs[name].apply(fs, Array.from(args).concat(callback));
		});
	};
}
