import { nonEmpty } from '/src/Content'
import { DATE, dates, noText, noDate, emptyDate } from '/src/Search'

const dateItem = (key, { date, time }) => date ? (
	time ? (
		<div key={key}>
			{key}: <strong>{date} {time}</strong>
		</div>
	) : (
		<div key={key}>
			{key}: <strong>{date}</strong>
		</div>
	)
) : (
	[]
)

const date = (description, start, end, bits) => {
	if (!emptyDate(start, end)) {
		description.push(
			<div key='date'>
				{description.length > 0 ? (
					<br/>
				) : (
					[]
				)}
				Date: <strong>{dates[bits & DATE] || 'Created'}</strong>
			</div>
		)

		description.push(dateItem('From', start))
		description.push(dateItem('To', end))
	}
}

const text = (description, search, checkboxes, bits) => {
	if (search) {
		description.push(
			<div key='search'>
				Search: <strong>{search}</strong>
				<br/>
				In: <strong>
					{checkboxes.map(([ key, { label } ]) => (
						bits & key ? label : ''
					)).filter(nonEmpty).join(', ')}
				</strong>
			</div>
		)
	}
}

function SearchDescription(props) {
	const { isAdvanced, bits, search, start, end } = props.search
	const { checkboxes } = props
	const description = []

	if (isAdvanced) {
		const hasNoText = noText(bits)
		const hasNoDate = noDate(bits)

		if (hasNoText && hasNoDate) {
			return []
		} else if (hasNoText) {
			date(description, start, end, bits)
		} else if (hasNoDate) {
			text(description, search, checkboxes, bits)
		} else {
			text(description, search, checkboxes, bits)
			date(description, start, end, bits)
		}
	} else if (search) {
		return (
			<>
				<br/>
				<div>
					Showing results for '<strong>{search}</strong>'...
				</div>
				{props.children}
			</>
		)
	}

	return (description.length > 0 ? (
		<>
			<br/>
			<div>Showing results for...</div>
			<br/>
			{description}
			{props.children}
		</>
	) : (
		[]
	))
}

export default SearchDescription
