var photon = require('./photon');

var AsyncCoroutine = require('../../asyncmc.js');

var app = photon(
).use(photon.common()
).use(photon.path()
).extend(photon.routing()
).use(function(req, res) {
	res.status(404).end('404');
});

app.routeStatic({
	'/search/': {
		'POST': function(req, res) {
			res.end('OK');
		}
	}
});

app.get(/^\/search\/(\d+)\/stream\.html$/, function(req, res, searchId) {
	res.setHeader('Content-Type', 'text/html; charset=UTF-8');
	res.setHeader('Transfer-Encoding', 'chunked');

	res.write('<html><body>');

	var count = 0;

	var intervalId = setInterval(function() {
		count++;

		if (count >= 30) {
			clearInterval(intervalId);
			res.end('</body></html>');
			return;
		}

		res.write('<script>console.log(' + count + ');</script>');
	}, 1000);
});

app.listen(9000);