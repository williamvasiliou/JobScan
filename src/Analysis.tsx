import { unique } from '/src/Keyword'
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

export const newNoun = ({ labels, jobs }) => ({
	labels: labels !== 1 ? 'Labels' : 'Label',
	jobs: jobs !== 1 ? 'Jobs' : 'Job',
})

export const newValues = (currentAnalysis, jobs) => {
	const labels = unique(jobs.map(({ labels }) => labels.map(({ id }) => id)).reduce((labels, newLabels) => [
		...labels,
		...newLabels,
	], []).sort())

	const rank = labels.map((id) => ({
		[id]: jobs.map(({ labels }) => (
			!!labels.find((label) => label.id === id)
		)).reduce((rank, newRank) => (
			rank + newRank
		), 0),
	})).reduce((labels, newLabels) => ({
			...labels,
			...newLabels,
	}), {})

	const byLabel = (previous, next) => previous.label > next.label
	const byRank = (previous, next) => rank[previous.id] < rank[next.id]
	const analysisLabels = labels.map((id) => ({
		...currentAnalysis.labels.labels[id],
		id,
	})).sort(byLabel).sort(byRank)

	const analysisJobs = jobs.map(({ id, job, labels }) => ({
		id,
		job,
		labels: labels.sort(byLabel).sort(byRank),
	}))

	const count = {
		labels: labels.length,
		jobs: jobs.length,
	}

	const noun = newNoun(count)

	return {
		count,
		noun,
		values: {
			labels: analysisLabels,
			jobs: analysisJobs,
		},
		rank,
	}
}

export const fromPrisma = (analysis) => {
	const rank = analysis.jobs.reduce((labels, { analysisLabelId }) => ({
		...labels,
		[analysisLabelId]: (labels[analysisLabelId] ?? 0) + 1,
	}), {})

	const analysisLabels = analysis.labels.labels
	const byLabel = (previous, next) => previous.label > next.label
	const byRank = (previous, next) => rank[previous.id] < rank[next.id]

	const labelsFromPrisma = (labels) => labels
		.map(Number)
		.map((id) => ({
			...analysisLabels[id],
			id,
		}))
		.sort(byLabel)
		.sort(byRank)

	const labels = labelsFromPrisma(Object.keys(analysisLabels))

	const jobs = Object.entries(analysis.jobs.reduce((jobs, { analysisLabelId, analysisJobId }) => ({
		...jobs,
		[analysisJobId]: [
			...(jobs[analysisJobId] ?? []),
			analysisLabelId,
		],
	}), {})).map(([ id, labels ]) => ({
		id,
		job: analysis.labels.jobs[id],
		labels: labelsFromPrisma(labels),
	}))

	const count = {
		labels: labels.length,
		jobs: jobs.length,
	}

	const noun = newNoun(count)

	return {
		...analysis,
		newTitle: analysis.title,
		isEditing: false,
		selected: {
			labels: [],
			jobs: [],
		},
		count,
		noun,
		values: {
			labels,
			jobs,
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

export const saveAnalysis = async (id, title, currentAnalysis, setCurrentAnalysis) => {
	const analysis = await fetchUpdate(`/analysis/${id}`, {
		title,
	})

	if (analysis) {
		setCurrentAnalysis({
			...currentAnalysis,
			title: analysis.title,
			newTitle: analysis.title,
			isEditing: false,
		})

		return true
	}

	return false
}
