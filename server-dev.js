import fs from 'fs/promises'
import express from 'express'
import { createServer } from 'vite'
import { middleware } from './server.js'

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

app.use(vite.middlewares)

app.use(express.json())

middleware(app, await vite.ssrLoadModule('/src/Prisma.tsx'))
app.use('*', async (req, res) => {
	try {
		const url = req.originalUrl.replace(base, '')

		const head = await fs.readFile('./src/index.css', 'utf-8')

		const template = await vite.transformIndexHtml(url, await fs.readFile('./index.html', 'utf-8'))
		const { render } = await vite.ssrLoadModule('./src/entry-server.tsx')

		res.status(200).set({
			'Content-Type': 'text/html',
		}).end(template
			.replace('<!--app-head-->', `<style type='text/css'>${head}</style>`)
			.replace('<!--app-html-->', await render())
		)
	} catch(e) {
		vite.ssrFixStacktrace(e)
		console.log(e.stack)
		res.status(500).end(e.stack)
	}
})

app.listen(port, () => {
	console.log(`Server started at http://localhost:${port}`)
})
