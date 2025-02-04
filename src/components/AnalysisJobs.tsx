import AnalysisLabels from './AnalysisLabels'

function AnalysisJobs({ jobs, currentAnalysis, setCurrentAnalysis }) {
	return (
		<ol>
			{jobs.map(({ id, job, labels }) => (
				<li key={id}>
					<hr/>
					<h4>{job}</h4>
					<AnalysisLabels
						labels={labels}
						jobId={id}
						currentAnalysis={currentAnalysis}
						setCurrentAnalysis={setCurrentAnalysis}
					/>
				</li>
			))}
		</ol>
	)
}

export default AnalysisJobs
