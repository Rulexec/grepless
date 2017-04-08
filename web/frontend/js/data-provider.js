in_package('Grepless.Web', function() {

this.provide(DataProvider);

function DataProvider() {
	const MOCK_SEARCH_LINES_STREAM = AsyncCoroutine.fromArray([
		{file: 'index.html', lineNumber: 42, line: 'Answer is 42'},
		{file: 'js/main.js', lineNumber: 13, line: 'Another line with 42'}
	]);

	/*
		Params:
			query: {type: 'string' | 'regexp', value: String}
		Returns:
			linesStream: Stream<{file: String, lineNumber: PNat, line: String}>
	*/
	this.search = function(/* params */) {
		return M.pure(null, {
			linesStream: MOCK_SEARCH_LINES_STREAM
		});
	};
}
DataProvider.QUERY_TYPE = {
	STRING: 'string',
	REGEXP: 'regexp'
};

});
