import { newValues } from '/src/Analysis'

function AnalysisLabels({ labels, jobId, currentAnalysis, setCurrentAnalysis }) {
	const { isRefined, isUpdated, selected } = currentAnalysis
	const selectedLabels = selected.labels
	const count = Math.max(1, currentAnalysis.count.jobs[isRefined])

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

	function button({ id, label, colorId, isDeleted }) {
		const selected = selectedLabels.indexOf(id) >= 0
		const button = `${label} (${(100.0 * currentAnalysis.rank[id] / count).toFixed(2)}%)`

		return (
			<button
				key={id}
				className={`analysis ${isUpdated ? 'next' : 'previous'} label ${selected ? 'selected' : ''} color-${colorId}`}
				onClick={() => selected ? remove(id) : select(id)}
			>
				{isDeleted ? (
					<del>
						{button}
					</del>
				) : (
					button
				)}
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
