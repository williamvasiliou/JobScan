import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import App from './components/App'
import './index.css'

import { colorsFromPrisma, fromPrisma } from './Keyword'
import { fetchRead } from './Fetch'

async function main() {
	const jobs = await fetchRead('/jobs')
	const colors = (await fetchRead('/colors')).reduce(colorsFromPrisma, {})
	const highlights = (await fetchRead('/highlights')).map(fromPrisma(colors))

	hydrateRoot(document.getElementById('root')!,
		<StrictMode>
			<App
				jobs={jobs}
				colors={colors}
				highlights={highlights}
			/>
		</StrictMode>,
	)
}

main()
