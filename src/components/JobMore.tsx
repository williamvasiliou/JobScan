function action(action, view, id) {
	if (id) {
		return (
			<button onClick={() => view(id)}>
				{action}
			</button>
		)
	}
}

function JobMore({ view, previous, next }) {
	const id = {
		previous: previous?.id,
		next: next?.id,
	}

	return (
		<>
			{id.previous || id.next ? (
				<hr/>
			) : (
				[]
			)}
			{action('Previous', view, id.previous)}
			{action('Next', view, id.next)}
		</>
	)
}

export default JobMore
