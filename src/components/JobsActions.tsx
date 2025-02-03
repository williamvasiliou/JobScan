import { ADD, LIST, ANALYSIS } from '/src/Job'

function JobsActions({ mode, setMode, hasAnalysis }) {
	return (mode === LIST ? (
			<>
				<button onClick={() => setMode(ADD)}>New Job</button>
				{hasAnalysis ? (
					<button onClick={() => setMode(ANALYSIS)}>Analysis</button>
				) : (
					[]
				)}
			</>
		) : (
			<button onClick={() => setMode(LIST)}>Back</button>
		)
	)
}

export default JobsActions
