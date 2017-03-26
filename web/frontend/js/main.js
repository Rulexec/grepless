function main() {
	let DataProvider = Grepless.Web.DataProvider,

	    SearchBoxView = Grepless.Web.UI.SearchBox.View,
			LinesListView = Grepless.Web.UI.LinesList.View;

	let dataProvider = new DataProvider(),
	    state = {
				//
			}

	let linesListView = new LinesListView();

  let searchBoxView = new SearchBoxView({
		onSearch: function({isRegexp, queryText}) {
			// TODO: validation, but not here, pass validators to the view

			searchBoxView.changeState({type: SearchBoxView.STATE.SEARCHING});

			// There we need to create new search

			dataProvider.search({
				query: {type: DataProvider.QUERY_TYPE[isRegexp ? 'REGEXP' : 'STRING'],
				        value: queryText}
			}).bind(function(result) {
				return linesListView.loadFrom(result.linesStream);
			}).run(function(error, result) {
				// RACE, but it will be replaced by searches list
				searchBoxView.changeState({type: SearchBoxView.STATE.NORMAL});

				error && console.error(error);
			});
		}
	});

	var rootEl = document.getElementById('grepless');

	rootEl.appendChild(searchBoxView.getElement());
	rootEl.appendChild(linesListView.getElement());
}

window.addEventListener('load', main);
