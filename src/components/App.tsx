import { useState } from 'react'

import Jobs from './Jobs'
import Keywords from './Keywords'

import { ADD, LIST } from '/src/Job'
import { HIGHLIGHTS } from '/src/Keyword'

function App(props) {
	const [showsJobs, setShowsJobs] = useState(true)

	const fetchJobs = props.jobs

	const [jobs, setJobs] = useState(fetchJobs)
	const hasJobs = jobs.length > 0

	const [jobsMode, setJobsMode] = useState(hasJobs ? LIST : ADD)
	const [jobsIndex, setJobsIndex] = useState(0)

	const [highlights, setHighlights] = useState(HIGHLIGHTS)

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
					mode={jobsMode}
					setMode={setJobsMode}
					jobs={jobs}
					setJobs={setJobs}
					index={jobsIndex}
					setIndex={setJobsIndex}
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
