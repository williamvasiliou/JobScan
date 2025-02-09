import { setChecked } from '/src/Search'

function SearchCheckboxes(props) {
	const { checkboxes, newSearch, setNewSearch } = props

	return checkboxes.map(([ key, { id, prop, label } ]) => (
		<span key={key}>
			<input
				id={`${props.id}-${id}`}
				defaultChecked={newSearch.checked[prop]}
				onChange={(e) => setNewSearch(setChecked(newSearch, prop, e.target.checked))}
				type='checkbox'
			/>
			<label htmlFor={`${props.id}-${id}`}>{label}</label>
		</span>
	))
}

export default SearchCheckboxes
