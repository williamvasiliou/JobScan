import { LIST } from '/src/Job'

function JobList(props) {
	const {
		items, item,
		itemTake, search,
		actions,
		setStartAfter,
		start, setStart,
	} = props

	const newStart = items.length >= itemTake ? items[itemTake - 1].id : 0

	const list = items.map(item.item)

	function next() {
		setStartAfter(true)
		setStart(newStart)
	}

	function previous() {
		if (items.length > 0) {
			setStartAfter(false)
			setStart(items[0].id)
		}
	}

	return (
		<>
			{search}
			<div>
				<br/>
				{actions}
			</div>
			{list.length > 0 ? (
				item[LIST] ? (
					<ol>
						{list}
					</ol>
				) : (
					<table>
						{item.header}
						<tbody>
							{list}
						</tbody>
					</table>
				)
			) : (
				<>
					<hr/>
					<div><em>There are no more results.</em></div>
				</>
			)}
			{start ? (
				<button onClick={previous}>Previous</button>
			) : (
				[]
			)}
			{newStart > 1 ? (
				<button onClick={next}>Next</button>
			) : (
				[]
			)}
		</>
	)
}

export default JobList
