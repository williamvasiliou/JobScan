import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Prisma from './components/Prisma'
import './index.css'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Prisma/>
	</StrictMode>,
)
