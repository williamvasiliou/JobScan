import { query } from '/src/Search'

import { fetchCreate, fetchRead, fetchUpdate } from '/src/Fetch'

export const addAnalysis = async (search, analysis, setAnalysis) => {
	const newAnalysis = await fetchCreate('/analysis', query(search).reduce((items, item) => {
		const [key, value] = item.split('=')

		return {
			...items,
			[key]: value,
		}
	}, {}))

	if (newAnalysis) {
		setAnalysis([
			...analysis,
			newAnalysis,
		])

		return true
	}

	return false
}

export const fromPrisma = (analysis) => {
	const rank = analysis.jobs.reduce((labels, { analysisLabelId }) => ({
		...labels,
		[analysisLabelId]: (labels[analysisLabelId] ?? 0) + 1,
	}), {})

	const byRank = (previous, next) => rank[previous] < rank[next]

	const labels = Object.keys(analysis.labels.labels).sort(byRank).map((id) => ({
		id,
		label: analysis.labels.labels[id],
	}))

	const jobs = Object.entries(analysis.jobs.reduce((jobs, { analysisLabelId, analysisJobId }) => ({
		...jobs,
		[analysisJobId]: [
			...(jobs[analysisJobId] ?? []),
			analysisLabelId,
		],
	}), {})).map(([ analysisJobId, labels ]) => [
		analysisJobId,
		analysis.labels.jobs[analysisJobId],
		labels.sort(byRank).map((id) => ({
			id,
			label: analysis.labels.labels[id],
		})),
	])

	const count = {
		labels: labels.length,
		jobs: Object.keys(analysis.labels.jobs).length,
	}

	return {
		...analysis,
		newTitle: analysis.title,
		isEditing: false,
		count,
		noun: {
			labels: count.labels !== 1 ? 'Labels' : 'Label',
			jobs: count.jobs !== 1 ? 'Jobs' : 'Job',
		},
		values: {
			labels: {
				id: labels.map(({ id }) => id),
				label: labels.map(({ label }) => label).join(', '),
			},
			jobs: {
				id: jobs.map(([ id, job, labels ]) => [
					id,
					job,
					labels.map(({ id }) => id),
				]),
				label: jobs.map(([ id, job, labels ]) => [
					id,
					job,
					labels.map(({ label }) => label).join(', '),
				]),
			},
		},
		rank,
	}
}

export const viewAnalysis = async (id, setCurrentAnalysis) => {
	const analysis = await fetchRead(`/analysis/${id}`)

	if (analysis) {
		setCurrentAnalysis(fromPrisma(analysis))

		return true
	}

	return false
}

export const saveAnalysis = async (id, title, setCurrentAnalysis) => {
	const analysis = await fetchUpdate(`/analysis/${id}`, {
		title,
	})

	if (analysis) {
		setCurrentAnalysis(fromPrisma(analysis))

		return true
	}

	return false
}
