function JobListActions({ actions, setCurrentItem }) {
	return actions.map(({ id, action }) => (
		<button
			key={id}
			onClick={() => setCurrentItem(actions[id])}
		>
			{action}
		</button>
	))
}

export default JobListActions
