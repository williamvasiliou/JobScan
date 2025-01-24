import fs from 'node:fs/promises'
import express from 'express'
import { createServer } from 'vite'

const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

const app = express()

const vite = await createServer({
	server: {
		middlewareMode: true,
	},
	appType: 'custom',
	base,
})

const prisma = await vite.ssrLoadModule('/src/Prisma.tsx')

app.use(vite.middlewares)

app.use(express.json())

app.get('/jobs', async (req, res) => {
	res.status(200).json({
		jobs: await prisma.job.findMany(),
	})
})

app.post('/jobs', async (req, res) => {
	const body = req.body

	try {
		const job = await prisma.job.create(
			body?.title,
			body?.url,
			body?.header,
			body?.content,
		)

		if (job) {
			res.status(200).json({
				data: job,
			})
		} else {
			throw new Error()
		}
	} catch (e) {
		console.log(e)
		res.status(500).json({})
	}
})

app.all('*', async (req, res) => {
	try {
		const url = req.originalUrl.replace(base, '')

		let template = await fs.readFile('./index.html', 'utf-8')
		template = await vite.transformIndexHtml(url, template)

		res.status(200).set({
			'Content-Type': 'text/html',
		}).end(template)
	} catch(e) {
		vite.ssrFixStacktrace(e)
		console.log(e.stack)
		res.status(500).end(e.stack)
	}
})

app.listen(port, () => {
	console.log(`Server started at http://localhost:${port}`)
})
