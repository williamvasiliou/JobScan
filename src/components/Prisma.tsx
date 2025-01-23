import { useState } from 'react'

import App from './App'

async function fetchJobs(setJobs) {
	const response = await fetch('http://localhost:5173/jobs')

	if (response.ok) {
		setJobs((await response.json()).jobs)
	}
}

function Prisma() {
	const [prismaFetch, setPrismaFetch] = useState(true)

	const [jobs, setJobs] = useState([])

	if (prismaFetch) {
		fetchJobs(setJobs)

		setPrismaFetch(false)
	}

	return (
		<App
			jobs={jobs}
			setJobs={setJobs}
		/>
	)
}

export default Prisma
