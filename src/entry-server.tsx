import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import Prisma from './components/Prisma'

export const render = () => renderToString(
	<StrictMode>
		<Prisma/>
	</StrictMode>,
)
