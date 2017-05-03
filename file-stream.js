var fsM = require('./fsM.js'),

    util = require('./util'),

    race = util.race,

    Closeable = require('./closeable'),
    AsyncCoroutine = require('./asyncmc');

exports.fileBinaryStream = fileBinaryStream;
exports.fileCloseableBinaryStream = fileCloseableBinaryStream;

function fileCloseableBinaryStream(filepath) {
	return fsM.open(filepath, 'r').fmap(function(fd) {
		var closeable = new Closeable({
			onCloseRequest: function(/*closeWith*/) {
				//
			}
		});

		var file = {
			closeable: closeable,
			stream: fileBinaryStream(fd, closeable)
		};

		// TODO
		// weak(file.stream, ...)

		return file;
	});
}

function fileBinaryStream(fd, closeable, opts) {
	const BUFFER_SIZE = 1024;

	let offset = opts && opts.offset || 0;

	return new AsyncCoroutine(function() {
		// TODO: share part of buffer to next call
		var buffer = Buffer.allocUnsafe(BUFFER_SIZE);

		return race([
			closeable.onClosed().result(function(really, closingError) {
				this.contError(closingError || new Error('closed'));
			}),
			fsM.read(fd, buffer, 0, BUFFER_SIZE, offset).result(function(bytesRead) {
				if (bytesRead === 0) {
					return null;
				}

				return new AsyncCoroutine.Value(
					buffer.slice(0, bytesRead),
					fileBinaryStream(fd, closeable, {offset: offset + bytesRead})
			  );
			})
		]);
	});
}
