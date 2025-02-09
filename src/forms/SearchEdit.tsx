import SearchCheckboxes from './SearchCheckboxes'
import SearchDate from './SearchDate'
import SearchDescription from '/src/components/SearchDescription'

import { reset, create, setAdvanced, removeAdvanced, empty, changed } from '/src/Search'

function SearchEdit(props) {
	const {
		search, setSearch,
		newSearch, setNewSearch,
		checkboxes,
		setStartAfter,
		setPreviousStart,
		start, setStart,
		addAnalysis,
	} = props

	const id = `search-${props.id}`

	function setNewSearchProp(prop, value) {
		setNewSearch({
			...newSearch,
			[prop]: value,
		})
	}

	const newSearchContent = create(newSearch)

	function handleSubmit(event) {
		event.preventDefault()

		if (!empty(newSearchContent) && changed(search, newSearchContent)) {
			setSearch(newSearchContent)

			setPreviousStart(-1)
			setStart(0)
		} else {
			if (!empty(search) || start) {
				setStartAfter(false)

				setPreviousStart(-1)
				setStart(0)
			}

			setSearch(reset)
			setNewSearch(reset)
		}
	}

	return (
		<>
			<form onSubmit={handleSubmit}>
				<label htmlFor={id}>Search: </label>
				<input
					id={id}
					defaultValue={newSearch.search}
					onChange={(e) => setNewSearchProp('search', e.target.value)}
					type='search'
					autoFocus
				/>
				<button type='submit'>
					{empty(search) || !empty(newSearchContent) && changed(search, newSearchContent) ? (
						'Search'
					) : (
						'Reset'
					)}
				</button>
				<br/>
				{newSearch.isAdvanced ? (
					<>
						<SearchCheckboxes
							id={id}
							checkboxes={checkboxes}
							newSearch={newSearch}
							setNewSearch={setNewSearch}
						/>
						<SearchDate
							id={id}
							newSearch={newSearch}
							setNewSearch={setNewSearch}
						/>
						<br/>
						<br/>
						<button onClick={() => setNewSearch(removeAdvanced(newSearch))}>Remove Advanced Filters</button>
					</>
				) : (
					<button onClick={() => setNewSearch(setAdvanced(newSearch))}>Advanced</button>
				)}
			</form>
			{!empty(search) ? (
				<SearchDescription
					search={search}
					checkboxes={checkboxes}
				>
					{addAnalysis ? (
						<>
							<br/>
							<button onClick={() => addAnalysis(search)}>New Analysis</button>
						</>
					) : (
						[]
					)}
				</SearchDescription>
			) : (
				[]
			)}
		</>
	)
}

export default SearchEdit
