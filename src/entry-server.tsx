import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './components/App'

import { colorsFromPrisma, fromPrisma } from './Keyword'
import { job, prismaColor, highlight } from './Prisma'

export const render = async () => {
	const jobs = await job.findMany()
	const colors = (await prismaColor.findMany()).reduce(colorsFromPrisma, {})
	const highlights = (await highlight.findMany()).map(fromPrisma(colors))

	return renderToString(
		<StrictMode>
			<App
				jobs={jobs}
				colors={colors}
				highlights={highlights}
			/>
		</StrictMode>,
	)
}
