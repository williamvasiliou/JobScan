import { newTitle } from '/src/Content'
import { jobTake } from '/src/Fetch'

function JobList(props) {
	const {
		jobs,
		search, setSearch,
		newSearch, setNewSearch,
		setStartAfter,
		setPreviousStart,
		start, setStart,
	} = props

	const newStart = jobs.length >= jobTake ? jobs[jobTake - 1].id : 0

	const list = jobs.map((job) => (
		<li key={job.id}>
			<div onClick={() => props.viewJob(job.id)}>
				<hr/>
				<span>#{job.id}</span>
				<br/>
				<strong>{job.title}</strong>
			</div>
			{job.url ?
				<a href={job.url} target='_blank'>{job.url}</a>
			:
				<button onClick={() => props.editJob(job.id)}>
					<em>Click to add URL</em>
				</button>
			}
			<br/>
			<br/>
		</li>
	))

	function handleSubmit(event) {
		event.preventDefault()

		const searchContent = newTitle(newSearch)

		if (searchContent && search !== searchContent) {
			setSearch(searchContent)

			setPreviousStart(-1)
			setStart(0)
		} else {
			if (search || start) {
				setStartAfter(false)

				setPreviousStart(-1)
				setStart(0)
			}

			setSearch('')
			setNewSearch('')
		}
	}

	function next() {
		setStartAfter(true)
		setStart(newStart)
	}

	function previous() {
		if (jobs.length > 0) {
			setStartAfter(false)
			setStart(jobs[0].id)
		}
	}

	return (
		<>
			<form onSubmit={handleSubmit}>
				<label htmlFor='search'>Search: </label>
				<input
					id='search'
					defaultValue={newSearch}
					onChange={(e) => setNewSearch(e.target.value)}
					type='text'
				/>
				<button type='submit'>
					{search && search === newTitle(newSearch) ? (
						'Reset'
					) : (
						'Search'
					)}
				</button>
			</form>
			{search ? (
				<div>Showing results for '<strong>{search}</strong>'...</div>
			) : (
				[]
			)}
			{list.length > 0 ? (
				<ol>
					{list}
				</ol>
			) : (
				[]
			)}
			{start ? (
				<button onClick={previous}>Previous</button>
			) : (
				[]
			)}
			{newStart > 1 ? (
				<button onClick={next}>Next</button>
			) : (
				[]
			)}
		</>
	)
}

export default JobList
