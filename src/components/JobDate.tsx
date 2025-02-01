import { dateTimeFromPrisma } from '/src/Content'
import { fetchUpdate } from '/src/Fetch'

function JobDate(props) {
	const {
		job,
		updateJob,
		updateProp,
	} = props

	const {
		id,
		isDateExpanded,
		isDating,
		createdAt,
		updatedAt,
		published,
	} = job

	function updatePublished(prop, value) {
		return (job) => ({
			...job,
			published: {
				...published,
				[prop]: value,
			},
		})
	}

	function cancelPublished() {
		updateJob((job) => ({
			...job,
			isDating: false,
			published: {
				...published,
				newDate: published.date,
				newTime: published.time,
			},
		}))
	}

	async function savePublished() {
		const { newDate, newTime } = published
		const date = newDate.trim()
		const time = newTime.trim()

		const newJob = await fetchUpdate(`/jobs/${id}/published`, {
			date: date,
			time: time,
		})

		if (newJob) {
			updateJob((job) => ({
				...job,
				isDating: false,
				updatedAt: new Date(newJob.updatedAt),
				published: dateTimeFromPrisma(newJob.published),
			}))
		}
	}

	return (
		<>
			<hr/>
			{isDateExpanded ? (
				<>
					<h3>Date</h3>
					<button onClick={() => updateJob(updateProp('isDateExpanded', false))}>Collapse</button>
					<br/>
					<br/>
					<div>Created At: {createdAt.toString()}</div>
					<div>Updated At: {updatedAt.toString()}</div>
					{isDating ? (
						<>
							<label htmlFor={`job-${id}-published-date`}>Published At: </label>
							<input
								id={`job-${id}-published-date`}
								defaultValue={job.published.newDate}
								onChange={(e) => updateJob(updatePublished('newDate', e.target.value))}
								type='date'
							/>
							<input
								id={`job-${id}-published-time`}
								defaultValue={job.published.newTime}
								onChange={(e) => updateJob(updatePublished('newTime', e.target.value))}
								type='time'
							/>
							<br/>
							<button onClick={cancelPublished}>Cancel</button>
							<button onClick={savePublished}>Save</button>
						</>
					) : (
						published.value ? (
							<>
								<div>Published At: {published.value.toString()}</div>
								<button onClick={() => updateJob(updateProp('isDating', true))}>Edit</button>
							</>
						) : (
							<button onClick={() => updateJob(updateProp('isDating', true))}>
								<em>Click to add Published At</em>
							</button>
						)
					)}
				</>
			) : (
				<button onClick={() => updateJob(updateProp('isDateExpanded', true))}>Expand Date</button>
			)}
		</>
	)
}

export default JobDate
