import { newValues } from '/src/Analysis'

function AnalysisLabels({ labels, jobId, currentAnalysis, setCurrentAnalysis }) {
	const { selected } = currentAnalysis
	const selectedLabels = selected.labels

	function select(id) {
		const currentJobs = currentAnalysis.values.jobs

		const findLabel = ({ labels }) => !!labels.find((label) => label.id === id)
		const jobs = currentJobs.filter(findLabel)

		const values = newValues(currentAnalysis, jobs)

		setCurrentAnalysis({
			...currentAnalysis,
			selected: {
				...selected,
				labels: [
					...selectedLabels,
					id,
				],
				jobs: [
					...selected.jobs,
					currentJobs,
				],
			},
			...values,
		})
	}

	function remove(id) {
		const index = selectedLabels.indexOf(id)

		setCurrentAnalysis({
			...currentAnalysis,
			selected: {
				...selected,
				labels: selectedLabels.slice(0, index),
				jobs: selected.jobs.slice(0, index),
			},
			...newValues(currentAnalysis, selected.jobs[index]),
		})
	}

	function button({ id, label, colorId }) {
		const selected = selectedLabels.indexOf(id) >= 0

		return (
			<button
				key={id}
				className={`analysis previous label ${selected ? 'selected' : ''} color-${colorId}`}
				onClick={() => selected ? remove(id) : select(id)}
			>
				{label} ({(100.0 * currentAnalysis.rank[id] / Math.max(1, currentAnalysis.count.jobs)).toFixed(2)}%)
			</button>
		)
	}

	return (
		<>
			{jobId ? (
				labels.map(button)
			) : (
				<>
					{selectedLabels.map((selected) => (
						button(labels.find(({ id }) => selected === id))
					))}
					{labels.filter(({ id }) => (
						selectedLabels.indexOf(id) < 0
					)).map(button)}
				</>
			)}
		</>
	)
}

export default AnalysisLabels
