import SearchCheckboxes from './SearchCheckboxes'
import SearchDate from './SearchDate'

import * as Search from '/src/Search'

function SearchEdit(props) {
	const {
		search, setSearch,
		newSearch, setNewSearch,
		setStartAfter,
		setPreviousStart,
		start, setStart,
	} = props

	function setNewSearchProp(prop, value) {
		setNewSearch({
			...newSearch,
			[prop]: value,
		})
	}

	const newSearchContent = Search.create(newSearch)

	function handleSubmit(event) {
		event.preventDefault()

		if (!Search.empty(newSearchContent) && Search.changed(search, newSearchContent)) {
			setSearch(newSearchContent)

			setPreviousStart(-1)
			setStart(0)
		} else {
			if (!Search.empty(search) || start) {
				setStartAfter(false)

				setPreviousStart(-1)
				setStart(0)
			}

			setSearch(Search.reset)
			setNewSearch(Search.reset)
		}
	}

	return (
		<>
			<form onSubmit={handleSubmit}>
				<label htmlFor='search'>Search: </label>
				<input
					id='search'
					defaultValue={newSearch.search}
					onChange={(e) => setNewSearchProp('search', e.target.value)}
					type='text'
				/>
				<button type='submit'>
					{Search.empty(search) || !Search.empty(newSearchContent) && Search.changed(search, newSearchContent) ? (
						'Search'
					) : (
						'Reset'
					)}
				</button>
				<br/>
				{newSearch.isAdvanced ? (
					<>
						<SearchCheckboxes
							id='search-0'
							newSearch={newSearch}
							setNewSearch={setNewSearch}
						/>
						<SearchDate
							id='search-0'
							newSearch={newSearch}
							setNewSearch={setNewSearch}
						/>
						<br/>
						<br/>
						<button onClick={() => setNewSearch(Search.removeAdvanced(newSearch))}>Remove Advanced Filters</button>
					</>
				) : (
					<button onClick={() => setNewSearch(Search.setAdvanced(newSearch))}>Advanced</button>
				)}
			</form>
			{!Search.empty(search) ? (
				<div>Showing results for '<strong>{search.search}</strong>'...</div>
			) : (
				[]
			)}
		</>
	)
}

export default SearchEdit
