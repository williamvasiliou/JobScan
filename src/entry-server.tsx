import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './components/App'
import * as prisma from '/src/Prisma'

export const {
	job, section, prismaColor, highlight, analysis, newResume,
} = prisma

export const render = async () => {
	const jobs = await job.findMany()
	const analysis = await prisma.analysis.findMany()

	return renderToString(
		<StrictMode>
			<App
				jobs={jobs}
				colors={[]}
				highlights={[]}
				analysis={analysis}
			/>
		</StrictMode>,
	)
}
