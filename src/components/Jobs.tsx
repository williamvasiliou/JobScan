import JobAdd from '/src/forms/JobAdd'
import JobList from './JobList'
import Job from './Job'

import * as Content from '/src/Content'
import * as JOB from '/src/Job'

function Jobs(props) {
	const {
		mode, setMode,
		jobs, setJobs,
		index, setIndex,
		highlights, setHighlights,
	} = props

	async function addJob(title, url, header, content) {
		const jobTitle = Content.newTitle(title)
		const jobUrl = url.trim()
		const jobHeader = Content.newTitle(header)
		const jobContent = Content.newContent(content)

		const response = await fetch('http://localhost:5173/jobs', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				title: jobTitle,
				url: jobUrl,
				header: jobHeader,
				content: jobContent,
			}),
		})

		if (response.ok) {
			setJobs([
				...jobs,
				(await response.json()).data,
			])

			setIndex(jobs.length)
			setMode(JOB.VIEW)
			return true
		}

		return false
	}

	function hasJob(index) {
		return (index >= 0) && (index < jobs.length)
	}

	function viewJob(index) {
		if (hasJob(index)) {
			setIndex(index)
			setMode(JOB.VIEW)
		}
	}

	function updateJob(index, update) {
		if (hasJob(index)) {
			jobs[index] = update(jobs[index])
			setJobs(jobs)
		}
	}

	function getJob(index) {
		return jobs[index]
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
				viewJob={viewJob}
				updateJob={updateJob}
			/>
		),
		() => (
			<Job
				jobs={jobs}
				index={index}
				updateJob={updateJob}
				getJob={getJob}
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
						<button onClick={() => setMode(JOB.ADD)}>New Job</button>
					) : (
						<button onClick={() => setMode(JOB.LIST)}>Back</button>
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
