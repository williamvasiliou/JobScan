import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './components/App'

import { job } from './Prisma'

export const render = async () => {
	const jobs = await job.findMany()

	return renderToString(
		<StrictMode>
			<App
				jobs={jobs}
			/>
		</StrictMode>,
	)
}
