import { useState } from 'react'

import Jobs from './Jobs'
import Keywords from './Keywords'

import { addKeyword } from '/src/Keyword'
import KeywordAdd from '/src/forms/KeywordAdd'

import { ITEM as ANALYSIS, addAnalysis } from '/src/Analysis'

import { ADD, LIST, ITEM as JOBS } from '/src/Job'
import { reset, empty, query as searchQuery } from '/src/Search'

import { fetchRead } from '/src/Fetch'

function App(props) {
	const [showsJobs, setShowsJobs] = useState(true)

	const [jobs, setJobs] = useState(props.jobs)
	const hasJobs = jobs.length > 0

	const [jobsMode, setJobsMode] = useState(hasJobs ? LIST : ADD)

	const [jobsSearch, setJobsSearch] = useState(reset)
	const [jobsNewSearch, setJobsNewSearch] = useState(reset)

	const [jobsCurrentItem, setJobsCurrentItem] = useState(JOBS)

	const [jobsAfter, setJobsAfter] = useState(true)
	const [jobsPreviousStart, setJobsPreviousStart] = useState(0)
	const [jobsStart, setJobsStart] = useState(0)

	const [currentJob, setCurrentJob] = useState(0)

	function showWelcome() {
		setShowsJobs(true)
		setJobsMode(ADD)
		setCurrentJob(0)
	}

	function setFromQuery(set, search, start, setAfter, setPrevious, setStart, mode) {
		return (items) => {
			if (items.length > 0) {
				set(items)
			} else if (empty(search)) {
				if (start) {
					setAfter(false)
					setPrevious(-1)
					setStart(0)
				} else {
					set([])
					mode()
				}
			} else {
				if (start) {
					setAfter(false)
					setPrevious(-1)
					setStart(0)
				}

				set(items)
			}
		}
	}

	async function setItems(search, after, start, resource, set) {
		const query = searchQuery(search)

		if (start) {
			if (after) {
				query.push(`after=${start}`)
			} else {
				query.push(`before=${start}`)
			}
		}

		if (query.length > 0) {
			fetchRead(`${resource}?${query.join('&')}`).then(set)
		} else {
			fetchRead(resource).then(set)
		}
	}

	if (jobsPreviousStart !== jobsStart) {
		const setJobsFromQuery = setFromQuery(
			setJobs,
			jobsSearch,
			jobsStart,
			setJobsAfter,
			setJobsPreviousStart,
			setJobsStart,
			showWelcome,
		)

		setItems(jobsSearch, jobsAfter, jobsStart, '/jobs', setJobsFromQuery)

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

	const [analysis, setAnalysis] = useState(props.analysis)
	const hasAnalysis = analysis.length > 0

	const [analysisSearch, setAnalysisSearch] = useState(reset)
	const [analysisNewSearch, setAnalysisNewSearch] = useState(reset)

	const [analysisCurrentItem, setAnalysisCurrentItem] = useState(ANALYSIS)

	const [analysisAfter, setAnalysisAfter] = useState(true)
	const [analysisPreviousStart, setAnalysisPreviousStart] = useState(0)
	const [analysisStart, setAnalysisStart] = useState(0)

	const [currentAnalysis, setCurrentAnalysis] = useState(0)

	async function newAnalysis(search) {
		if (await addAnalysis(search, analysis, setAnalysis)) {
			setAnalysisPreviousStart(analysisStart - 1)
		}
	}

	if (analysisPreviousStart !== analysisStart) {
		const setAnalysisFromQuery = setFromQuery(
			setAnalysis,
			analysisSearch,
			analysisStart,
			setAnalysisAfter,
			setAnalysisPreviousStart,
			setAnalysisStart,
			() => setJobsMode(LIST),
		)

		setItems(analysisSearch, analysisAfter, analysisStart, '/analysis', setAnalysisFromQuery)

		setAnalysisPreviousStart(analysisStart)
	}

	const welcome = hasJobs || !empty(jobsSearch) || jobsStart

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
					currentItem={jobsCurrentItem}
					setCurrentItem={setJobsCurrentItem}
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
					hasAnalysis={hasAnalysis}
					analysis={analysis}
					addAnalysis={newAnalysis}
					analysisSearch={analysisSearch}
					setAnalysisSearch={setAnalysisSearch}
					analysisNewSearch={analysisNewSearch}
					setAnalysisNewSearch={setAnalysisNewSearch}
					analysisCurrentItem={analysisCurrentItem}
					setAnalysisCurrentItem={setAnalysisCurrentItem}
					setAnalysisStartAfter={setAnalysisAfter}
					setAnalysisPreviousStart={setAnalysisPreviousStart}
					analysisStart={analysisStart}
					setAnalysisStart={setAnalysisStart}
					currentAnalysis={currentAnalysis}
					setCurrentAnalysis={setCurrentAnalysis}
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
