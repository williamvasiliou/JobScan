import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './components/App'
import * as prisma from '/src/Prisma'

export const render = async () => {
	const jobs = await prisma.job.findMany()

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

export const job = prisma.job
export const section = prisma.section
export const prismaColor = prisma.prismaColor
export const highlight = prisma.highlight
