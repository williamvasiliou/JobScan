import { jobTake } from '/src/Prisma'

function JobList(props) {
	const { jobs, start, setStart } = props
	const newStart = jobs[0].id - jobTake

	const list = jobs.map((job) => (
		<li key={job.id}>
			<div onClick={() => props.viewJob(job.id)}>
				<span>{job.id}</span>
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

	function next() {
		if (start) {
			setStart(Math.max(jobTake, jobs[jobTake - 1].id - 1))
		} else if(newStart >= jobTake) {
			setStart(newStart)
		} else {
			setStart(jobTake)
		}
	}

	function previous() {
		setStart(start + jobTake)
	}

	return (
		<>
			<ol>
				{list}
			</ol>
			{start ? (
				<button onClick={previous}>Previous</button>
			) : (
				[]
			)}
			{newStart > 0 ? (
				<button onClick={next}>Next</button>
			) : (
				[]
			)}
		</>
	)
}

export default JobList
