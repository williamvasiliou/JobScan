import AnalysisActions from './AnalysisActions'
import JobList from './JobList'

import { viewAnalysis, saveAnalysis } from '/src/Analysis'
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

const date = (date, start, end) => (
	<>
		<br/>
		<br/>
		<div>Date: <strong>{date}</strong></div>
		<div>From: <strong>{start.date} {start.time}</strong></div>
		<div>To: <strong>{end.date} {end.time}</strong></div>
	</>
)

function description(id, bits, search, start, end) {
	if (bits > 0) {
		if (bits & DATE) {
			return (
				<>
					{text(`${id}-search`, search)}
					<br/>
					{checkboxes(`${id}-search`, bits)}
					{date(dates[bits & DATE] || 'Created', start, end)}
				</>
			)
		} else {
			return (
				<>
					{text(`${id}-search`, search)}
					<br/>
					{checkboxes(`${id}-search`, bits)}
					{date('Created', start, end)}
				</>
			)
		}
	} else {
		return (
			<>
				{text(`${id}-search`, search)}
				{date('Created', start, end)}
			</>
		)
	}
}

function analysisView(currentAnalysis, setCurrentAnalysis, updatePreviousStart) {
	const {
		id,
		title, newTitle,
		isEditing,
		createdAt,
		search,
		filter,
		start, end,
	} = currentAnalysis

	function edit() {
		setCurrentAnalysis({
			...currentAnalysis,
			isEditing: true,
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
		if (await saveAnalysis(id, newTitle, setCurrentAnalysis)) {
			updatePreviousStart()
		}
	}

	return (
		<>
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
			{description(`analysis-${id}`, filter, search, newDateTime(start), newDateTime(end))}
			<hr/>
			<h3>{currentAnalysis.count.labels} {currentAnalysis.noun.labels}</h3>
			{currentAnalysis.values.labels.label}
			<hr/>
			<h3>{currentAnalysis.count.jobs} {currentAnalysis.noun.jobs}</h3>
			<ol>
				{currentAnalysis.values.jobs.label.map(([ id, job, labels ]) => (
					<li key={id}>
						<hr/>
						<h4>{job}</h4>
						<div>{labels}</div>
					</li>
				))}
			</ol>
		</>
	)
}

function Analysis(props) {
	const {
		analysis,
		setMode,
		setStartAfter,
		setPreviousStart,
		start, setStart,
		currentAnalysis, setCurrentAnalysis,
	} = props

	function updatePreviousStart() {
		setPreviousStart(start - 1)
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
				analysisView(currentAnalysis, setCurrentAnalysis, updatePreviousStart)
			) : (
				<JobList
					items={analysis}
					item={({ id, title, createdAt }) => (
						<li key={id} onClick={() => viewAnalysis(id, setCurrentAnalysis)}>
							<hr/>
							<div>#{id}</div>
							<div><strong>{title}</strong></div>
							<div>{createdAt}</div>
						</li>
					)}
					itemTake={analysisTake}
					search={undefined}
					setStartAfter={setStartAfter}
					start={start}
					setStart={setStart}
				/>
			)}
		</>
	)
}

export default Analysis
