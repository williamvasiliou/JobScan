import JobAdd from '/src/forms/JobAdd'
import JobList from './JobList'
import Job from './Job'

import * as Content from '/src/Content'
import * as JOB from '/src/Job'

import { fetchCreate, fetchRead, fetchUpdate } from '/src/Prisma'

function Jobs(props) {
	const {
		jobs,
		mode, setMode,
		setPreviousStart,
		start, setStart,
		currentJob, setCurrentJob,
		highlights, setHighlights,
	} = props

	function setModeWithoutJob(mode) {
		setMode(mode)
		setCurrentJob(0)
	}

	async function addJob(title, url, header, content) {
		const job = await fetchCreate('/jobs', {
			title: Content.newTitle(title),
			url: url.trim(),
			header: Content.newTitle(header),
			content: Content.newContent(content),
		})

		if (job) {
			setMode(JOB.VIEW)
			setPreviousStart(start - 1)
			setCurrentJob(Content.fromPrisma(job))

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
			setMode(JOB.VIEW)
			setCurrentJob(Content.fromPrisma(job))
		}
	}

	async function editJob(id) {
		if (currentJob) {
			return
		}

		const job = await fetchRead(`/jobs/${id}`)

		if (job) {
			setMode(JOB.VIEW)
			setCurrentJob({
				...Content.fromPrisma(job),
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

			const job = await fetchUpdate(`/jobs/${currentJob.id}`, Content.toPrisma(updated))

			if (job) {
				setPreviousStart(start - 1)
				setCurrentJob(updated)
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
				jobs={jobs}
				start={start}
				setStart={setStart}
				editJob={editJob}
				viewJob={viewJob}
			/>
		),
		() => (
			<Job
				job={currentJob}
				updateJob={updateJob}
				saveJob={saveJob}
				highlights={highlights}
				setHighlights={setHighlights}
			/>
		),
	]

	return (
		<>
			{jobs.length > 0 ? (
				<>
					{mode === JOB.LIST ? (
						<button onClick={() => setModeWithoutJob(JOB.ADD)}>New Job</button>
					) : (
						<button onClick={() => setModeWithoutJob(JOB.LIST)}>Back</button>
					)}
					<br/>
					{views[mode]()}
				</>
			) : (
				views[JOB.ADD]()
			)}
		</>
	)
}

export default Jobs
