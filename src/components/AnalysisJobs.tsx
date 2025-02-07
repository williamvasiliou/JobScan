import AnalysisLabels from './AnalysisLabels'

function AnalysisJobs({ jobs, currentAnalysis, setCurrentAnalysis }) {
	return (
		<ol>
			{jobs.map(({ id, title, url, labels }) => (
				<li key={id}>
					<hr/>
					<h4>{title}</h4>
					{url ? (
						<a href={url} target='_blank'>{url}</a>
					) : (
						<em>URL</em>
					)}
					<br/>
					<br/>
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
