import * as ACTION from '/src/Action'

function SectionActions(props) {
	const section = props.section

	const isExpanded = section.isExpanded
	const setExpanded = props.setExpanded

	const action = section.action.type
	const setAction = props.setAction

	const callbacks = props.callbacks[action]

	function buttons() {
		const cancel = () => setAction(ACTION.VIEWING)

		switch(action) {
			case ACTION.VIEWING:
				return (
					<>
						<button onClick={callbacks.edit}>Edit</button>
						<button onClick={callbacks.delete}>Delete</button>
						<button onClick={callbacks.split}>Split</button>
						<button onClick={callbacks.join}>Join</button>
						<button onClick={callbacks.move}>Move</button>
						<button onClick={callbacks.search}>Find</button>
					</>
				)
			case ACTION.EDITING:
				return (
					<>
						<button onClick={callbacks.cancel}>Cancel</button>
						<button onClick={callbacks.save}>Save</button>
					</>
				)
			case ACTION.DELETING:
				return (
					<>
						<button onClick={cancel}>Cancel</button>
						<button onClick={callbacks.delete}>Delete</button>
					</>
				)
			case ACTION.SPLITTING:
				return (
					<>
						<button onClick={cancel}>Cancel</button>
						<button onClick={callbacks.first}>First</button>
						<button onClick={callbacks.up}>Up</button>
						<button onClick={callbacks.down}>Down</button>
						<button onClick={callbacks.last}>Last</button>
						<button onClick={callbacks.split}>Split</button>
					</>
				)
			case ACTION.JOINING:
				return (
					<>
						<button onClick={cancel}>Cancel</button>
						<button onClick={callbacks.join}>Join</button>
					</>
				)
			case ACTION.MOVING:
				return (
					<>
						<button onClick={cancel}>Cancel</button>
						<button onClick={callbacks.first}>First</button>
						<button onClick={callbacks.up}>Up</button>
						<button onClick={callbacks.down}>Down</button>
						<button onClick={callbacks.last}>Last</button>
					</>
				)
			case ACTION.SEARCHING:
				return (
					<>
						<button onClick={cancel}>Cancel</button>
						<button onClick={callbacks.keyword}>Keyword</button>
					</>
				)
		}
	}

	return (isExpanded ? (
		<>
			<button onClick={() => setExpanded(false)}>Collapse</button>
			{buttons()}
		</>
	) : (
		<button onClick={() => setExpanded(true)}>Expand</button>
	))
}

export default SectionActions
