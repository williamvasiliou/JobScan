import JobsActions from './JobsActions'
import JobAdd from '/src/forms/JobAdd'
import SearchEdit from '/src/forms/SearchEdit'
import JobList from './JobList'
import Job from './Job'
import Analysis from './Analysis'

import { newTitle, newContent, fromPrisma, toPrisma } from '/src/Content'
import { ADD, VIEW, ANALYSIS } from '/src/Job'

import { fetchCreate, fetchRead, fetchUpdate, jobTake } from '/src/Fetch'

function Jobs(props) {
	const { hasAnalysis, analysis, mode, setMode } = props

	if (mode === ANALYSIS) {
		const {
			setAnalysisStartAfter,
			setAnalysisPreviousStart,
			analysisStart, setAnalysisStart,
			currentAnalysis, setCurrentAnalysis,
		} = props

		return (
			<Analysis
				analysis={analysis}
				setMode={setMode}
				setStartAfter={setAnalysisStartAfter}
				setPreviousStart={setAnalysisPreviousStart}
				start={analysisStart}
				setStart={setAnalysisStart}
				currentAnalysis={currentAnalysis}
				setCurrentAnalysis={setCurrentAnalysis}
			/>
		)
	}

	const {
		welcome, jobs,
		search, setSearch,
		newSearch, setNewSearch,
		isStartAfter, setStartAfter,
		setPreviousStart,
		start, setStart,
		currentJob, setCurrentJob,
		colors, setColors,
		highlights, setHighlights,
		addAnalysis,
	} = props

	function setModeWithoutJob(mode) {
		setMode(mode)
		setCurrentJob(0)
	}

	async function addJob(title, url, header, content) {
		const job = await fetchCreate('/jobs', {
			title: newTitle(title),
			url: url.trim(),
			header: newTitle(header),
			content: newContent(content),
		})

		if (job) {
			setMode(VIEW)
			setPreviousStart(start - 1)
			setCurrentJob(fromPrisma(job))

			return true
		}

		return false
	}

	async function viewJob(id) {
		if (currentJob) {
			return
		}

		const job = await fetchRead(`/jobs/${id}`)

		if (job) {
			setMode(VIEW)
			setCurrentJob(fromPrisma(job))
		}
	}

	async function editJob(id) {
		if (currentJob) {
			return
		}

		const job = await fetchRead(`/jobs/${id}`)

		if (job) {
			setMode(VIEW)
			setCurrentJob({
				...fromPrisma(job),
				isEditing: true,
			})
		}
	}

	function updateJob(update) {
		if (currentJob) {
			setCurrentJob(update(currentJob))
		}
	}

	async function saveJob(update) {
		if (currentJob) {
			const updated = update(currentJob)

			const job = await fetchUpdate(`/jobs/${currentJob.id}`, toPrisma(updated))

			if (job) {
				const { title, url, updatedAt } = job

				setPreviousStart(start - 1)
				setCurrentJob({
					...updated,
					title,
					url,
					updatedAt: new Date(updatedAt),
				})
			}
		}
	}

	const views = [
		() => (
			<JobAdd
				title='Untitled Job'
				url=''
				header='Description'
				content=''
				onSubmit={addJob}
			/>
		),
		() => (
			<JobList
				items={jobs}
				item={({ id, title, url }) => (
					<li key={id}>
						<div onClick={() => viewJob(id)}>
							<hr/>
							<div>#{id}</div>
							<strong>{title}</strong>
						</div>
						{url ?
							<a href={url} target='_blank'>{url}</a>
						:
							<button onClick={() => editJob(id)}>
								<em>Click to add URL</em>
							</button>
						}
						<br/>
						<br/>
					</li>
				)}
				itemTake={jobTake}
				search={
					<SearchEdit
						id='jobs'
						search={search}
						setSearch={setSearch}
						newSearch={newSearch}
						setNewSearch={setNewSearch}
						setStartAfter={setStartAfter}
						setPreviousStart={setPreviousStart}
						start={start}
						setStart={setStart}
						addAnalysis={addAnalysis}
					/>
				}
				setStartAfter={setStartAfter}
				start={start}
				setStart={setStart}
			/>
		),
		() => (
			<Job
				job={currentJob}
				updateJob={updateJob}
				saveJob={saveJob}
				colors={colors}
				setColors={setColors}
				highlights={highlights}
				setHighlights={setHighlights}
			/>
		),
	]

	return (
		<>
			{!isStartAfter || welcome ? (
				<>
					<JobsActions
						mode={mode}
						setMode={setModeWithoutJob}
						hasAnalysis={hasAnalysis}
					/>
					<br/>
					{views[mode]()}
				</>
			) : (
				views[ADD]()
			)}
		</>
	)
}

export default Jobs
