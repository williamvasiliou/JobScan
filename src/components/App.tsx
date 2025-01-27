import { useState } from 'react'

import Jobs from './Jobs'
import Keywords from './Keywords'

import { addKeyword } from '/src/Keyword'
import KeywordAdd from '/src/forms/KeywordAdd'

import { ADD, LIST } from '/src/Job'

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

	const [colors, setColors] = useState(props.colors)
	const [highlights, setHighlights] = useState(props.highlights)

	const [newLabel, setNewLabel] = useState('')
	const [newKeywords, setNewKeywords] = useState('')
	const [newColor, setNewColor] = useState('#ff0000')

	async function addHighlight(label, keywords, color) {
		await addKeyword(label, keywords, color.replace('#', ''), colors, setColors, highlights, setHighlights)
	}

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
