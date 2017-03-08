var M = require('asyncm');

module.exports = Closeable;

function Closeable(options) {
	let onCloseRequest = options.onCloseRequest;

	let closed = false,
	    closedWith = null;

	let onClosedWaiters = [];

	this.close = function(closingError) {
		if (closed) return M.pure(null, false, closedWith);

		if (!closingError) closingError = new Error('closed');

		return onCloseRequest(closingError).bind(function(result, realClosedWith) {
			setImmediate(notifyClosed);

			if (typeof result === 'boolean') {
				closed = true;
				closedWith = realClosedWith;

				this.cont(null, result, closedWith);
			} else {
				this.cont(null, null, realClosedWith);
			}
		});
	};

	this.onClosed = function() {
		if (closed) return M.pure(null, true, closedWith);

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
