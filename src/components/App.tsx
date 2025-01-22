import { useState } from 'react'

import Jobs from './Jobs'
import Keywords from './Keywords'

import { ADD } from '/src/Job'
import { HIGHLIGHTS } from '/src/Keyword'

function App() {
	const [showsJobs, setShowsJobs] = useState(true)

	const [jobsMode, setJobsMode] = useState(ADD)
	const [jobsIndex, setJobsIndex] = useState(0)
	const [jobs, setJobs] = useState([])

	const [highlights, setHighlights] = useState(HIGHLIGHTS)

	return (
		<>
			<header>
				<h1>JobScan</h1>
				{jobs.length > 0 ? (
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
					setAppJobsMode={setJobsMode}
					jobs={jobs}
					setAppJobs={setJobs}
					index={jobsIndex}
					setAppJobsIndex={setJobsIndex}
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
