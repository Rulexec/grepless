var M = require('asyncm');

module.exports = Closeable;

function Closeable(options) {
	let onCloseRequest = options.onCloseRequest;

	let closed = false,
	    closedWith = null;

	let onClosedWaiters = [];

	this.close = function(closingError) {
		if (closed) return M.result(false, closedWith);

		if (!closingError) closingError = new Error('closed');

		return onCloseRequest(closingError).result(function(result, realClosedWith) {
			setImmediate(notifyClosed);

			if (typeof result === 'boolean') {
				closed = true;
				closedWith = realClosedWith;

				this.contResult(result, closedWith);
			} else {
				this.contResult(null, realClosedWith);
			}
		});
	};

	this.onClosed = function() {
		if (closed) return M.result(true, closedWith);

		return new M(function(callback) {
			onClosedWaiters.push(callback);
		});
	};

	function notifyClosed() {
		var old = onClosedWaiters;

		onClosedWaiters = [];

		old.forEach(function(f) {
			if (closed) f(null, true, closedWith);
			else f(null, false);
		});
	}
}
