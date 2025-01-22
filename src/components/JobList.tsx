import { list } from '/src/Content'

function JobList(props) {
	const jobs = list(props.jobs, (key, job) => (
		<li key={key} onClick={() => props.viewJob(key)}>
			<strong>{job.title}</strong>
			<br/>
			{job.url ?
				<a href={job.url} target='_blank'>{job.url}</a>
			:
				<button
					onClick={() => props.updateJob(
						key,
						(job) => ({
							...job,
							isEditing: true,
						})
					)}
				>
					<em>Click to add URL</em>
				</button>
			}
		</li>
	))

	return (
		<ol>
			{jobs}
		</ol>
	)
}

export default JobList
