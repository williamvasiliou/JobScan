import { useState } from 'react'

import Jobs from './Jobs'
import Keywords from './Keywords'

import { ADD, LIST } from '/src/Job'
import { fromPrisma } from '/src/Keyword'

import { fetchRead } from '/src/Prisma'

function App(props) {
	const [showsJobs, setShowsJobs] = useState(true)

	const [jobs, setJobs] = useState(props.jobs)
	const hasJobs = jobs.length > 0

	const [jobsMode, setJobsMode] = useState(hasJobs ? LIST : ADD)

	const [jobsPreviousStart, setJobsPreviousStart] = useState(0)
	const [jobsStart, setJobsStart] = useState(0)
	const [jobsMaxStart, setJobsMaxStart] = useState(hasJobs ? jobs[0].id : 0)

	const [currentJob, setCurrentJob] = useState(0)

	if (!hasJobs) {
		if (jobsStart > 0) {
			setJobsPreviousStart(0)
			setJobsStart(0)
		} else if(!showsJobs) {
			setShowsJobs(true)
			setJobsMode(ADD)
			setCurrentJob(0)
		}
	} else if(jobsMaxStart) {
		if (jobsMaxStart < jobsStart) {
			fetchRead(`/jobs/${jobsStart}/id`).then((job) => {
				if (job) {
					setJobsMaxStart(jobsStart)
				} else {
					setJobsPreviousStart(0)
					setJobsStart(0)
				}
			})
		} else if(jobsMaxStart === jobsStart) {
			fetchRead(`/jobs/${jobsStart + 1}/id`).then((job) => {
				if (job) {
					setJobsMaxStart(jobsStart + 1)
				} else {
					setJobsPreviousStart(0)
					setJobsStart(0)
				}
			})
		}
	}

	if (!jobsStart && hasJobs && jobsMaxStart < jobs[0].id) {
		setJobsMaxStart(jobs[0].id)
	}

	if (jobsPreviousStart !== jobsStart) {
		if (jobsStart) {
			fetchRead(`/jobs?start=${jobsStart}`).then((jobs) => setJobs(jobs))
		} else {
			fetchRead('/jobs').then((jobs) => setJobs(jobs))
		}

		setJobsPreviousStart(jobsStart)
	}

	const [highlights, setHighlights] = useState(props.highlights.map(fromPrisma))

	return (
		<>
			<header>
				<h1>JobScan</h1>
				{hasJobs ? (
					showsJobs ? (
						<button onClick={() => setShowsJobs(false)}>Keywords</button>
					) : (
						<button onClick={() => setShowsJobs(true)}>Jobs</button>
					)
				) : (
					[]
				)}
				<hr/>
			</header>
			{showsJobs ? (
				<Jobs
					jobs={jobs}
					setJobs={setJobs}
					mode={jobsMode}
					setMode={setJobsMode}
					previousStart={jobsPreviousStart}
					setPreviousStart={setJobsPreviousStart}
					start={jobsStart}
					setStart={setJobsStart}
					currentJob={currentJob}
					setCurrentJob={setCurrentJob}
					highlights={highlights}
					setHighlights={setHighlights}
				/>
			) : (
				<Keywords
					highlights={highlights}
					setHighlights={setHighlights}
				/>
			)}
		</>
	)
}

export default App
