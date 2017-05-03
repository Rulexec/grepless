in_package('Grepless.Web', function() {

this.provide(DataProvider);

function DataProvider() {
	const MOCK_SEARCH_LINES_STREAM = AsyncCoroutine.fromArray([
		{file: 'index.html', lineNumber: 42, line: 'Answer is 42'},
		{file: 'js/main.js', lineNumber: 13, line: 'Another line with 42'}
	]);
	const MOCK_SUBSEARCH_LINES_STREAM = AsyncCoroutine.fromArray([
		{file: 'index.html', lineNumber: 42, line: 'Answer is 42'}
	]);

	const SEARCH_MOCKS = [
		MOCK_SEARCH_LINES_STREAM,
		MOCK_SUBSEARCH_LINES_STREAM
	];

	let self = this;

	/*
		Params:
			query: {type: 'string' | 'regexp', value: String}
		Returns:
			subSearch: <same API>

			linesStream: Stream<{file: String, lineNumber: PNat, line: String}>
			cancelStream: Async
	*/
	this.search = function(mockId) {
		if (typeof mockId !== 'number') mockId = 0;

		var mockStream = SEARCH_MOCKS[mockId];

		return M.result({
			subSearch: function() {
				return self.search(1);
			},
			linesStream: mockStream,
			cancelStream: function() { console.log('cancelled'); return M.result(); }
		});
	};
}
DataProvider.QUERY_TYPE = {
	STRING: 'string',
	REGEXP: 'regexp'
};

});
