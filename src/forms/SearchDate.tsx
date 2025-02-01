import { CREATED, UPDATED, PUBLISHED, setChecked, setDate } from '/src/Search'

function SearchDate(props) {
	const { newSearch, setNewSearch } = props
	const hasDate = newSearch.checked.isDate

	return (
		<>
			{hasDate ? (
				<>
					<br/>
					<br/>
				</>
			) : (
				[]
			)}
			<input
				id={`${props.id}-date`}
				defaultChecked={hasDate}
				onChange={(e) => setNewSearch(setChecked(newSearch, 'isDate', e.target.checked))}
				type='checkbox'
			/>
			{hasDate ? (
				<>
					<label htmlFor={`${props.id}-date`}>Date </label>
					<select
						id={`${props.id}-date-type`}
						defaultValue={newSearch.date}
						onChange={(e) => setNewSearch({
							...newSearch,
							date: e.target.value,
						})}
					>
						<option value={CREATED}>Created</option>
						<option value={UPDATED}>Updated</option>
						<option value={PUBLISHED}>Published</option>
					</select>
					<br/>
					<label htmlFor={`${props.id}-start-date`}>From: </label>
					<input
						id={`${props.id}-start-date`}
						defaultValue={newSearch.start.date}
						onChange={(e) => setNewSearch(setDate(newSearch, 'start', 'date', e.target.value))}
						type='date'
					/>
					<input
						id={`${props.id}-start-time`}
						defaultValue={newSearch.start.time}
						onChange={(e) => setNewSearch(setDate(newSearch, 'start', 'time', e.target.value))}
						type='time'
					/>
					<br/>
					<label htmlFor={`${props.id}-end-date`}>To: </label>
					<input
						id={`${props.id}-end-date`}
						defaultValue={newSearch.end.date}
						onChange={(e) => setNewSearch(setDate(newSearch, 'end', 'date', e.target.value))}
						type='date'
					/>
					<input
						id={`${props.id}-end-time`}
						defaultValue={newSearch.end.time}
						onChange={(e) => setNewSearch(setDate(newSearch, 'end', 'time', e.target.value))}
						type='time'
					/>
				</>
			) : (
				<label htmlFor={`${props.id}-date`}>Date</label>
			)}
		</>
	)
}

export default SearchDate
