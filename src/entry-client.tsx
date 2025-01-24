import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App'
import './index.css'

import { fetchRead } from './Prisma'

const { jobs } = await fetchRead('/jobs')

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App
			jobs={jobs}
		/>
	</StrictMode>,
)
