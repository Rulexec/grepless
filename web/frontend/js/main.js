function main() {
	let DataProvider = Grepless.Web.DataProvider,

	    SearchBoxView = Grepless.Web.UI.SearchBox.View,
	    LinesListView = Grepless.Web.UI.LinesList.View;

	let dataProvider = new DataProvider();

	let linesListView = new LinesListView();

	let searchHistory = [];

	let currentSearch = null;

	let searchBoxView = new SearchBoxView({
		onSearch: function({isRegexp, queryText}) {
			// TODO: validation, but not here, pass validators to the view

			searchBoxView.changeState({type: SearchBoxView.STATE.SEARCHING});

			// There we need to create new search

			let searchMethod = dataProvider.search.bind(dataProvider);

			if (currentSearch) {
				currentSearch.cancel();

				if (currentSearch.search) {
					searchMethod = currentSearch.search.subSearch.bind(currentSearch.search);

					searchHistory.push(currentSearch);
					searchBoxView.toggleRevertButton(true);
				}
			}

			let thisSearch = {
				search: null,
				isCancelled: false,
				searchRunning: null,
				cancel: function() {
					thisSearch.isCancelled = true;

					thisSearch.searchRunning.cancel().run();

					if (thisSearch.search) {
						thisSearch.search.cancelStream().run();
					}
				}
			};

			currentSearch = thisSearch;

			thisSearch.searchRunning = searchMethod({
				query: {type: DataProvider.QUERY_TYPE[isRegexp ? 'REGEXP' : 'STRING'],
				        value: queryText}
			}).result(function(result) {
				if (thisSearch.cancelled) return M.error('cancelled');

				thisSearch.search = result;

				return linesListView.loadFrom(result.linesStream);
			}).resultOrError(function() {
				searchBoxView.changeState({type: SearchBoxView.STATE.NORMAL});
			}).run();
		},

		onRevert: function() {
			searchBoxView.changeState({type: SearchBoxView.STATE.NORMAL});

			cancelCurrentSearch();

			currentSearch = searchHistory.pop();
			searchBoxView.toggleRevertButton(!!searchHistory.length);

			currentSearch.isCancelled = false;
			linesListView.loadFrom(currentSearch.search.linesStream).run();
		},

		onReset: function() {
			searchBoxView.changeState({type: SearchBoxView.STATE.NORMAL});

			linesListView.reset();

			cancelCurrentSearch();
			searchHistory = [];
		}
	});

	function cancelCurrentSearch() {
		if (currentSearch) {
			currentSearch.isCancelled = true;

			if (currentSearch.search) {
				currentSearch.search.cancelStream().run();
			}
		}
	}

	var rootEl = document.getElementById('grepless');

	rootEl.appendChild(searchBoxView.getElement());
	rootEl.appendChild(linesListView.getElement());
}

window.addEventListener('load', main);
