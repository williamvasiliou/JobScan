import { useState } from 'react'

import Jobs from './Jobs'
import Keywords from './Keywords'

import { addKeyword } from '/src/Keyword'
import KeywordAdd from '/src/forms/KeywordAdd'

import { ADD, LIST } from '/src/Job'

import { fetchRead } from '/src/Fetch'

function App(props) {
	const [showsJobs, setShowsJobs] = useState(true)

	const [jobs, setJobs] = useState(props.jobs)
	const hasJobs = jobs.length > 0

	const [jobsMode, setJobsMode] = useState(hasJobs ? LIST : ADD)

	const [jobsSearch, setJobsSearch] = useState('')
	const [jobsNewSearch, setJobsNewSearch] = useState('')

	const [jobsAfter, setJobsAfter] = useState(true)
	const [jobsPreviousStart, setJobsPreviousStart] = useState(0)
	const [jobsStart, setJobsStart] = useState(0)

	const [currentJob, setCurrentJob] = useState(0)

	function showFirstJobs() {
		setJobsPreviousStart(-1)
		setJobsStart(0)
	}

	function showWelcome() {
		setShowsJobs(true)
		setJobsMode(ADD)
		setCurrentJob(0)
	}

	if (!hasJobs) {
		if (jobsSearch) {
			if (jobsStart > 0) {
				showFirstJobs()
			}
		} else {
			if (jobsStart > 0) {
				showFirstJobs()
			} else if(!showsJobs && jobsAfter) {
				showWelcome()
			}
		}
	}

	if (jobsPreviousStart !== jobsStart) {
		const query = []

		if (jobsSearch) {
			query.push(`q=${jobsSearch}`)
		}

		if (jobsStart) {
			if (jobsAfter) {
				query.push(`after=${jobsStart}`)
			} else {
				query.push(`before=${jobsStart}`)
			}
		}

		if (query.length > 0) {
			fetchRead(`/jobs?${query.join('&')}`).then((jobs) => setJobs(jobs))
		} else {
			fetchRead('/jobs').then((jobs) => setJobs(jobs))
		}

		setJobsPreviousStart(jobsStart)
	}

	const [colors, setColors] = useState(props.colors)
	const [highlights, setHighlights] = useState(props.highlights)

	const [newLabel, setNewLabel] = useState('')
	const [newKeywords, setNewKeywords] = useState('')
	const [newColor, setNewColor] = useState('#ff0000')

	async function addHighlight(label, keywords, color) {
		await addKeyword(label, keywords, color.replace('#', ''), colors, setColors, highlights, setHighlights)
	}

	const welcome = hasJobs || jobsSearch || jobsStart

	return (
		<>
			<header>
				<h1>JobScan</h1>
				{welcome ? (
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
					welcome={welcome}
					jobs={jobs}
					setJobs={setJobs}
					mode={jobsMode}
					setMode={setJobsMode}
					search={jobsSearch}
					setSearch={setJobsSearch}
					newSearch={jobsNewSearch}
					setNewSearch={setJobsNewSearch}
					isStartAfter={jobsAfter}
					setStartAfter={setJobsAfter}
					previousStart={jobsPreviousStart}
					setPreviousStart={setJobsPreviousStart}
					start={jobsStart}
					setStart={setJobsStart}
					currentJob={currentJob}
					setCurrentJob={setCurrentJob}
					colors={colors}
					setColors={setColors}
					highlights={highlights}
					setHighlights={setHighlights}
				/>
			) : (
				<Keywords
					colors={colors}
					setColors={setColors}
					highlights={highlights}
					setHighlights={setHighlights}
				>
					<KeywordAdd
						id={0}
						onSubmit={addHighlight}
						label={newLabel}
						setLabel={setNewLabel}
						keywords={newKeywords}
						setKeywords={setNewKeywords}
						color={newColor}
						setColor={setNewColor}
					/>
				</Keywords>
			)}
		</>
	)
}

export default App
