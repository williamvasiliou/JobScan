import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './components/App'
import * as prisma from '/src/Prisma'

export const {
	job, section, prismaColor, highlight,
} = prisma

export const render = async () => {
	const jobs = await job.findMany()

	return renderToString(
		<StrictMode>
			<App
				jobs={jobs}
				colors={[]}
				highlights={[]}
			/>
		</StrictMode>,
	)
}
