in_package('Grepless.Web.UI.LinesList', function() {

this.provide(View);

function View() {
	let el = instantiate_template('lines-list-template');
	this.getElement = function() { return el; };

	let currentStream = null;

	let linesListEl = el.querySelector('.lines-list');

	this.loadFrom = function(linesStream) {
		currentStream = linesStream;

		linesListEl.innerHTML = '';

		return linesStream.reduceStreamM(function(acc, lineInfo) {
			if (currentStream !== linesStream) return M.pure({type: View.ERROR.OTHER_STREAM_IS_LOADED});

			let lineEl = instantiate_template('lines-list-line-template');

			lineEl.querySelector('.file-path').innerText = lineInfo.file;
			lineEl.querySelector('.line-number').innerText = lineInfo.lineNumber.toString();
			lineEl.querySelector('.line-text').innerText = lineInfo.line;

			linesListEl.appendChild(lineEl);
		});
	};

	this.reset = function() {
		currentStream = null;

		linesListEl.innerHTML = '';
	};
}
View.ERROR = {
	OTHER_STREAM_IS_LOADED: 'other-stream-is-loaded'
};

});
