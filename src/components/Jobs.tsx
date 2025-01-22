import { useState } from 'react'

import JobAdd from '/src/forms/JobAdd'
import JobList from './JobList'
import Job from './Job'

import * as Content from '/src/Content'
import * as JOB from '/src/Job'

function Jobs(props) {
	const [mode, setMode] = useState(props.mode)

	const [jobsIndex, setJobsIndex] = useState(props.index)
	const [jobs, setJobs] = useState(props.jobs)

	function setAppState(appState, state) {
		return (newState) => {
			appState(newState)
			state(newState)
		}
	}

	const setAppJobs = setAppState(props.setAppJobs, setJobs)
	const setAppJobsMode = setAppState(props.setAppJobsMode, setMode)
	const setAppJobsIndex = setAppState(props.setAppJobsIndex, setJobsIndex)

	function addJob(title, url, header, content) {
		const jobTitle = Content.newTitle(title)
		const jobUrl = url.trim()
		const jobHeader = Content.newTitle(header)
		const jobContent = Content.newContent(content)

		if (jobTitle && jobHeader && jobContent) {
			setAppJobs([
				...jobs,
				Content.job(jobTitle, jobUrl, jobHeader, jobContent),
			])

			setAppJobsIndex(jobs.length)
			setAppJobsMode(JOB.VIEW)
			return true
		}

		return false
	}

	function hasJob(index) {
		return (index >= 0) && (index < jobs.length)
	}

	function viewJob(index) {
		if (hasJob(index)) {
			setAppJobsIndex(index)
			setAppJobsMode(JOB.VIEW)
		}
	}

	function updateJob(index, update) {
		if (hasJob(index)) {
			jobs[index] = update(jobs[index])
			setAppJobs(jobs)
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
				index={jobsIndex}
				updateJob={updateJob}
				getJob={getJob}
				highlights={props.highlights}
				setHighlights={props.setHighlights}
			/>
		),
	]

	return (
		<>
			{jobs.length > 0 ? (
				<>
					{mode === JOB.LIST ? (
						<button onClick={() => setAppJobsMode(JOB.ADD)}>New Job</button>
					) : (
						<button onClick={() => setAppJobsMode(JOB.LIST)}>Back</button>
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
