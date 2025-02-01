function JobList(props) {
	const {
		items, item,
		itemTake, search,
		setStartAfter,
		start, setStart,
	} = props

	const newStart = items.length >= itemTake ? items[itemTake - 1].id : 0

	const list = items.map(item)

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
			{list.length > 0 ? (
				<ol>
					{list}
				</ol>
			) : (
				[]
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
