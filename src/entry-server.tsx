import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './components/App'

import { job, highlight } from './Prisma'

export const render = async () => {
	const jobs = await job.findMany()
	const highlights = await highlight.findMany()

	return renderToString(
		<StrictMode>
			<App
				jobs={jobs}
				highlights={highlights}
			/>
		</StrictMode>,
	)
}
