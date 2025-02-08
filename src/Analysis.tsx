import { iso, utc } from './Content'
import { LIST } from './Job'
import { unique } from './Keyword'
import { query } from './Search'

import { fetchCreate, fetchRead, fetchUpdate, fetchDelete } from '/src/Fetch'

export const ITEM = {
	id: 0,
	action: 'Compact',
	[LIST]: true,
	item: (view, remove) => (
		({ id, title, createdAt }) => (
			<li key={id}>
				<div onClick={() => view(id)}>
					<hr/>
					<div>#{id}</div>
					<div><strong>{title}</strong></div>
					<div>{utc(createdAt)}</div>
				</div>
				<button onClick={() => remove(id)}>Delete</button>
				<br/>
				<br/>
			</li>
		)
	),
}

export const ACTIONS = [
	ITEM,
	{
		id: 1,
		action: 'Detailed',
		[LIST]: false,
		header: (
			<thead>
				<tr>
					<td>Delete</td>
					<td>Analysis</td>
					<td>Title</td>
					<td>Created At</td>
				</tr>
			</thead>
		),
		item: (view, remove) => (
			({ id, title, createdAt }) => (
				<tr key={id}>
					<td>
						<button onClick={() => remove(id)}>Delete</button>
					</td>
					<td onClick={() => view(id)}>
						#{id}
					</td>
					<td onClick={() => view(id)}>
						<strong>{title}</strong>
					</td>
					<td onClick={() => view(id)}>
						{iso(createdAt)}
					</td>
				</tr>
			)
		),
	},
]

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

export const byLabel = (previous, next) => previous.label > next.label
export const byJob = (previous, next) => previous.job > next.job

export const newCount = (labels, jobs) => ({
	labels: labels.length,
	jobs: {
		[false]: jobs.length,
		[true]: jobs.filter(({ labels }) => !!labels.length).length,
	},
})

export const newNoun = ({ labels, jobs }) => ({
	labels: labels !== 1 ? 'Labels' : 'Label',
	jobs: {
		[false]: jobs[false] !== 1 ? 'Jobs' : 'Job',
		[true]: jobs[true] !== 1 ? 'Jobs' : 'Job',
	},
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

	const byRank = (previous, next) => rank[previous.id] < rank[next.id]
	const analysisLabels = labels.map((id) => ({
		...currentAnalysis.labels.labels[id],
		id,
	})).sort(byLabel).sort(byRank)

	const rankLabels = (labels, { id }) => labels + rank[id]
	const byJobRank = (previous, next) => previous.labels.reduce(rankLabels, 0) < next.labels.reduce(rankLabels, 0)

	const analysisJobs = jobs.map((job) => ({
		...job,
		labels: job.labels.sort(byLabel).sort(byRank),
	})).sort(byJob).sort(byJobRank)

	const count = newCount(labels, jobs)
	const noun = newNoun(count)

	return {
		count,
		noun,
		...updatedValues(currentAnalysis.isUpdated, {
			labels: analysisLabels,
			jobs: analysisJobs,
		}),
		rank,
	}
}

export const updatedValue = (updated, previous, next) => updated ? (
	next ?? previous
) : (
	previous ?? next
)

export const updatedLabels = (updated, labels) => labels.map((label) => ({
	...label,
	label: updatedValue(updated, label.previous, label.next),
	isDeleted: updated && label.next === null,
}))

export const updatedValues = (updated, { labels, jobs }) => ({
	values: {
		labels: updatedLabels(updated, labels),
		jobs: jobs.map((job) => ({
			...job,
			title: updatedValue(updated, job.previous?.title, job.next?.title),
			url: updatedValue(updated, job.previous?.url, job.next?.url),
			createdAt: updatedValue(updated, job.previous?.createdAt, job.next?.createdAt),
			updatedAt: updatedValue(updated, job.previous?.updatedAt, job.next?.updatedAt),
			published: updated ? (
				job.next ? (
					job.next.published
				) : (
					job.previous.published
				)
			) : (
				job.previous ? (
					job.previous.published
				) : (
					job.next.published
				)
			),
			labels: updatedLabels(updated, job.labels),
			isDeleted: updated && job.next === null,
		})),
	},
})

export const fromPrisma = (analysis) => {
	const rank = Object.values(analysis.jobs).reduce((labels, newLabels) => [
		...labels,
		...newLabels,
	], []).reduce((labels, id) => ({
		...labels,
		[id]: (labels[id] ?? 0) + 1,
	}), {})

	const analysisLabels = analysis.labels.labels
	const byRank = (previous, next) => rank[previous.id] < rank[next.id]

	const labelsFromPrisma = (labels) => labels
		.map(Number)
		.map((id) => ({
			...analysisLabels[id],
			id,
			isDeleted: false,
		}))
		.sort(byLabel)
		.sort(byRank)

	const labels = labelsFromPrisma(Object.keys(analysisLabels))

	const rankLabels = (labels, { id }) => labels + rank[id]
	const byJobRank = (previous, next) => previous.labels.reduce(rankLabels, 0) < next.labels.reduce(rankLabels, 0)

	const jobs = Object.entries(analysis.jobs).map(([ id, labels ]) => ({
		...analysis.labels.jobs[id],
		id,
		labels: labelsFromPrisma(labels),
		isDeleted: false,
	})).sort(byJob).sort(byJobRank)

	const count = newCount(labels, jobs)
	const noun = newNoun(count)

	return {
		...analysis,
		newTitle: analysis.title,
		isEditing: false,
		isRefined: false,
		isUpdated: false,
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

export const deleteAnalysis = async (id, setPreviousStart) => {
	const analysis = await fetchDelete(`/analysis/${id}`)

	if (analysis) {
		setPreviousStart()

		return true
	}

	return false
}
