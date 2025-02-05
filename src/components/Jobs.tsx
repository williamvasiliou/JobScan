import JobsActions from './JobsActions'
import JobAdd from '/src/forms/JobAdd'
import SearchEdit from '/src/forms/SearchEdit'
import JobList from './JobList'
import JobListActions from './JobListActions'
import Job from './Job'
import Analysis from './Analysis'

import { newTitle, newContent, fromPrisma, toPrisma } from '/src/Content'
import { ADD, VIEW, ANALYSIS, ACTIONS } from '/src/Job'

import { fetchCreate, fetchRead, fetchUpdate, jobTake } from '/src/Fetch'

function Jobs(props) {
	const { hasAnalysis, analysis, mode, setMode } = props

	if (mode === ANALYSIS) {
		const {
			analysisCurrentItem, setAnalysisCurrentItem,
			setAnalysisStartAfter,
			setAnalysisPreviousStart,
			analysisStart, setAnalysisStart,
			currentAnalysis, setCurrentAnalysis,
		} = props

		return (
			<Analysis
				analysis={analysis}
				setMode={setMode}
				currentItem={analysisCurrentItem}
				setCurrentItem={setAnalysisCurrentItem}
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
		currentItem, setCurrentItem,
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
		const job = await fetchRead(`/jobs/${id}`)

		if (job) {
			const currentJob = fromPrisma(job)

			setMode(VIEW)
			setCurrentJob(currentJob)

			return currentJob
		}

		return false
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
				item={{
					...currentItem,
					item: currentItem.item(viewJob, editJob),
				}}
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
		),
		() => (
			<Job
				job={currentJob}
				updateJob={updateJob}
				saveJob={saveJob}
				viewJob={viewJob}
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
