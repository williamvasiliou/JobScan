import { LIST } from '/src/Job'

function AnalysisActions({ setMode, currentAnalysis, setCurrentAnalysis }) {
	return (currentAnalysis ? (
		<button onClick={() => setCurrentAnalysis(0)}>Back</button>
	) : (
		<button onClick={() => setMode(LIST)}>Jobs</button>
	))
}

export default AnalysisActions
