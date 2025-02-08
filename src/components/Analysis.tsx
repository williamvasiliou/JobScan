import AnalysisActions from './AnalysisActions'
import AnalysisLabels from './AnalysisLabels'
import AnalysisJobs from './AnalysisJobs'
import JobList from './JobList'
import JobListActions from './JobListActions'
import JobMore from './JobMore'

import { ACTIONS, updatedValues, viewAnalysis, saveAnalysis, deleteAnalysis } from '/src/Analysis'
import { DATE, checkboxes as searchCheckboxes, dates } from '/src/Search'

import { analysisTake } from '/src/Fetch'

function newDateTime(dateTime) {
	const newDate = new Date(dateTime)

	const [date, timeString] = newDate.toISOString().split('T')
	const time = timeString.slice(0, 8)

	return {
		date,
		time,
	}
}

const text = (id, search) => (
	<>
		<label htmlFor={id}>Search: </label>
		<input
			id={id}
			value={search}
			disabled={true}
			type='text'
		/>
	</>
)

const checkboxes = (id, bits) => (
	searchCheckboxes.map(([ key, { label } ]) => (
		<span key={key}>
			<input
				id={`${id}-${key}`}
				checked={bits & key}
				disabled={true}
				type='checkbox'
			/>
			<label htmlFor={`${id}-${key}`}>{label}</label>
		</span>
	))
)

const date = (id, date, start, end) => (
	<>
		<br/>
		<br/>
		<input
			id={`${id}-date`}
			checked={!!date}
			disabled={true}
			type='checkbox'
		/>
		<label htmlFor={`${id}-date`}>
			Date: <strong>{date || 'Created'}</strong>
		</label>
		<br/>
		<div>From: <strong>{start.date} {start.time}</strong></div>
		<div>To: <strong>{end.date} {end.time}</strong></div>
	</>
)

function description(id, bits, search, start, end) {
	if (bits > 0) {
		return (
			<>
				{text(id, search)}
				<br/>
				{checkboxes(id, bits)}
				{date(id, dates[bits & DATE] ?? 0, start, end)}
			</>
		)
	} else {
		return (
			<>
				{text(id, search)}
				{date(id, 0, start, end)}
			</>
		)
	}
}

function analysisView(currentAnalysis, setCurrentAnalysis, updatePreviousStart, view) {
	const {
		id,
		title, newTitle,
		isEditing,
		isRefined,
		isUpdated,
		createdAt,
		search,
		filter,
		start, end,
		count,
		noun,
		values,
		style,
		previous, next,
	} = currentAnalysis

	const canRefine = count.jobs[false] !== count.jobs[true] && !!count.jobs[true]

	function edit() {
		setCurrentAnalysis({
			...currentAnalysis,
			isEditing: true,
		})
	}

	function refine(refined) {
		setCurrentAnalysis({
			...currentAnalysis,
			isRefined: refined,
		})
	}

	function updated(updated) {
		setCurrentAnalysis({
			...currentAnalysis,
			isUpdated: updated,
			...updatedValues(updated, values),
		})
	}

	function setNewTitle(newTitle) {
		setCurrentAnalysis({
			...currentAnalysis,
			newTitle,
		})
	}

	function cancel() {
		setCurrentAnalysis({
			...currentAnalysis,
			newTitle: title,
			isEditing: false,
		})
	}

	async function save() {
		if (await saveAnalysis(id, newTitle, currentAnalysis, setCurrentAnalysis)) {
			updatePreviousStart()
		}
	}

	return (
		<>
			<style>
				{style}
			</style>
			{isEditing ? (
				<>
					<label htmlFor={`analysis-${id}-title`}>Title:</label>
					<br/>
					<input
						id={`analysis-${id}-title`}
						defaultValue={newTitle}
						onChange={(e) => setNewTitle(e.target.value)}
						type='text'
					/>
					<br/>
					<label htmlFor={`analysis-${id}-created`}>Created At:</label>
					<br/>
					<input
						id={`analysis-${id}-created`}
						value={createdAt}
						disabled={true}
						type='text'
					/>
					<br/>
					<br/>
					<button onClick={cancel}>Cancel</button>
					<button onClick={save}>Save</button>
				</>
			) : (
				<>
					<h2>{title}</h2>
					<div>{createdAt}</div>
					<br/>
					<button onClick={edit}>Edit</button>
				</>
			)}
			<hr/>
			<h3>Search</h3>
			{description(`analysis-${id}-search`, filter, search, newDateTime(start), newDateTime(end))}
			<input
				id={`analysis-${id}-updated`}
				defaultChecked={isUpdated}
				onChange={(e) => updated(e.target.checked)}
				type='checkbox'
			/>
			<label htmlFor={`analysis-${id}-updated`}>Updated</label>
			<hr/>
			<h3>{count.labels} {noun.labels}</h3>
			<AnalysisLabels
				labels={values.labels}
				jobId={false}
				currentAnalysis={currentAnalysis}
				setCurrentAnalysis={setCurrentAnalysis}
			/>
			<hr/>
			<h3>{count.jobs[isRefined]} {noun.jobs[isRefined]}</h3>
			{isRefined || canRefine ? (
				<>
					<input
						id={`analysis-${id}-refine`}
						defaultChecked={isRefined}
						disabled={!canRefine}
						onChange={(e) => refine(e.target.checked)}
						type='checkbox'
					/>
					<label htmlFor={`analysis-${id}-refine`}>Refine</label>
					<br/>
					<br/>
				</>
			) : (
				[]
			)}
			<AnalysisJobs
				jobs={values.jobs}
				currentAnalysis={currentAnalysis}
				setCurrentAnalysis={setCurrentAnalysis}
			/>
			<JobMore
				view={view}
				previous={previous}
				next={next}
			/>
		</>
	)
}

function Analysis(props) {
	const {
		analysis,
		setMode,
		currentItem, setCurrentItem,
		setStartAfter,
		setPreviousStart,
		start, setStart,
		currentAnalysis, setCurrentAnalysis,
	} = props

	function style(analysis) {
		setCurrentAnalysis({
			...analysis,
			style: Object.entries(analysis.labels.colors).map(([ colorId, { previous, next } ]) => (
`.analysis.previous.label.color-${colorId} {
	border-color: #${previous ?? next};
}

.analysis.previous.label.color-${colorId}:hover,
.analysis.previous.label.selected.color-${colorId} {
	background-color: #${previous ?? next};
}

.analysis.next.label.color-${colorId} {
	border-color: #${next ?? previous};
}

.analysis.next.label.color-${colorId}:hover,
.analysis.next.label.selected.color-${colorId} {
	background-color: #${next ?? previous};
}`
			)).join('\n'),
		})
	}

	function updatePreviousStart() {
		setPreviousStart(start - 1)
	}

	function view(id) {
		viewAnalysis(id, style)
	}

	function remove(id) {
		deleteAnalysis(id, updatePreviousStart)
	}

	return (
		<>
			<AnalysisActions
				setMode={setMode}
				currentAnalysis={currentAnalysis}
				setCurrentAnalysis={setCurrentAnalysis}
			/>
			<br/>
			{currentAnalysis ? (
				analysisView(currentAnalysis, setCurrentAnalysis, updatePreviousStart, view)
			) : (
				<JobList
					items={analysis}
					item={{
						...currentItem,
						item: currentItem.item(view, remove),
					}}
					itemTake={analysisTake}
					search={undefined}
					actions={
						<JobListActions
							actions={ACTIONS}
							setCurrentItem={setCurrentItem}
						/>
					}
					setStartAfter={setStartAfter}
					start={start}
					setStart={setStart}
				/>
			)}
		</>
	)
}

export default Analysis
