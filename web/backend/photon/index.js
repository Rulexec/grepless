var http = require('http');

exports = module.exports = function(options) {
	return new Photon(options);
};

// extensions
['routing'
].forEach(function(extension) {
    exports[extension] = require('./extensions/' + extension);
});

// middlewares
['common', 'decodeURI', 'mime', 'cookie', 'auth', 'session', 'path',
 'hostRedirect', 'cache'
].forEach(function(middleware) {
    exports[middleware] = require('./middlewares/' + middleware);
});

// from connect
/*['cookieParser', 'urlencoded'
].forEach(function(middleware) {
    exports[middleware] = connect[middleware];
});*/

function Photon() {
	var middlewares = [];

	var server = http.createServer(function(req, res) {
		var middlewareIndex = 0;

		next();

		function next() {
			if (middlewareIndex < middlewares.length) {
				let middleware = middlewares[middlewareIndex];

				middlewareIndex++;

				middleware(req, res, next);
			} else {
				res.end('No middleware');
			}
		}
	});

	this.use = function(f) {
		if (typeof f !== 'function') throw new Error('Is not a function ' + f);

		middlewares.push(f);
		return this;
	};
	this.extend = function(extension) {
		extension.call(this);
		return this;
	};

	this.listen = server.listen.bind(server);
}