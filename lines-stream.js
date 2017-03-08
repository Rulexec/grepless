var M = require('asyncm'),
    Immutable = require('immutable');

var fsM = require('./fsM.js'),
    path = require('path'),

		util = require('./util'),
		generatorToList = util.generatorToList,

		AsyncCoroutine = require('./asyncmc');

function linesStream(buffersStream) {
	return buffersStream.transform(new AsyncCoroutine(transformer.bind(null, Immutable.List())));

	function transformer(buffers, maybeBuffer) {
		if (!maybeBuffer) {
			let line = joinBuffers(buffers).toString('utf8');

			if (buffers.length) { // allow empty line
				return M.pure(null, new AsyncCoroutine.Value(AsyncCoroutine.single(line), null));
			} else {
				return M.pure(null, null);
			}
		}

		let buffer = maybeBuffer.value;

		let pos = 0;

		let lines = [];

		for (let i = 0; i < buffer.length; i++) {
			let b = buffer[i];

			if (b === 10) { // 10 = ord('\n')
				// suboptimal
				buffers = buffers.push(buffer.slice(pos, i));
				let line = joinBuffers(buffers).toString('utf8');

				lines.push(line);

				buffers = Immutable.List();

				pos = i + 1;
			}
		}

		if (pos < buffer.length) {
			buffers = buffers.push(buffer.slice(pos));
		}

		return M.pure(null, new AsyncCoroutine.Value(
			lines.length ? AsyncCoroutine.fromArray(lines) : null,
			new AsyncCoroutine(transformer.bind(null, buffers))
		));
	}

	function joinBuffers(buffers) {
		var totalLength = 0;

		buffers.forEach(function(buffer) { totalLength += buffer.length; });

		var resultBuffer = Buffer.allocUnsafe(totalLength);

		var pos = 0;

		buffers.forEach(function(buffer) {
			buffer.copy(resultBuffer, pos, 0, buffer.length);

			pos += buffer.length;
		});

		return resultBuffer;
	}
}
