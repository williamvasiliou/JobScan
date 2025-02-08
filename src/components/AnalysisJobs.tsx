import AnalysisLabels from './AnalysisLabels'

function AnalysisJobs({ jobs, currentAnalysis, setCurrentAnalysis }) {
	return (
		<ol>
			{(currentAnalysis.isRefined ? (
				jobs.filter(({ labels }) => !!labels.length)
			) : (
				jobs
			)).map(({ id, title, url, labels, isDeleted }) => (
				<li key={id}>
					<hr/>
					{isDeleted ? (
						<del><h4>{title}</h4></del>
					) : (
						<h4>{title}</h4>
					)}
					{url ? (
						<a href={url} target='_blank'>{url}</a>
					) : (
						<em>No URL</em>
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
