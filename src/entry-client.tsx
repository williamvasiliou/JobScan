import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App'
import './index.css'

import { colorsFromPrisma, fromPrisma } from './Keyword'
import { fetchRead } from './Prisma'

const jobs = await fetchRead('/jobs')
const colors = (await fetchRead('/colors')).reduce(colorsFromPrisma, {})
const highlights = (await fetchRead('/highlights')).map(fromPrisma(colors))

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App
			jobs={jobs}
			colors={colors}
			highlights={highlights}
		/>
	</StrictMode>,
)
