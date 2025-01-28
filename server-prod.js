import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { middleware } from './server.js'

const port = process.env.PORT || 5173
const base = 'dist/client'

const app = express()

const template = (await fs.readFile(`./${base}/index.html`, 'utf-8')).replace('<!--app-head-->', '')

app.use(express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)), base), {
	index: false,
}))

const entry = await import('./dist/server/entry-server.js')
const { render } = entry

app.use(express.json())

middleware(app, entry)
app.use('*', async (req, res) => {
	try {
		res.status(200).set({
			'Content-Type': 'text/html',
		}).end(template
			.replace('<!--app-html-->', await render())
		)
	} catch(e) {
		res.status(500).end(e)
	}
})

app.listen(port, () => {
	console.log(`Server started at http://localhost:${port}`)
})
