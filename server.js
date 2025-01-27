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

const err = (err, res) => {
	console.log(err)
	res.status(500).json({})
}

const prismaQuery = async (res, query) => {
	try {
		const json = await query()

		if (json) {
			res.status(200).json(json)
		} else {
			throw new Error()
		}
	} catch (e) {
		err(e, res)
	}
}

app.get('/jobs', async (req, res) => {
	try {
		const start = Number(req.query?.start)

		if (isNaN(start)) {
			res.status(200).json(await prisma.job.findMany())
		} else if (start > 0) {
			res.status(200).json(await prisma.job.findManyStart(start))
		} else {
			throw new Error()
		}
	} catch(e) {
		err(e, res)
	}
})

app.get('/jobs/:id/id', async (req, res) => {
	await prismaQuery(res, async () => await prisma.job.findUniqueSelect(Number(req.params?.id)))
})

app.get('/jobs/:id', async (req, res) => {
	await prismaQuery(res, async () => await prisma.job.findUnique(Number(req.params?.id)))
})

app.post('/jobs', async (req, res) => {
	const body = req.body

	await prismaQuery(res, async () => (
		await prisma.job.create(
			body?.title,
			body?.url,
			body?.header,
			body?.content,
		)
	))
})

app.put('/jobs/:id', async (req, res) => {
	const { body, params } = req

	await prismaQuery(res, async () => (
		await prisma.job.update(
			Number(params?.id),
			body?.title,
			body?.url,
		)
	))
})

app.get('/sections/:id', async (req, res) => {
	await prismaQuery(res, async () => await prisma.section.findUnique(Number(req.params?.id)))
})

app.post('/jobs/:id/sections', async (req, res) => {
	const { body, params } = req

	await prismaQuery(res, async () => (
		await prisma.section.create(
			Number(params?.id),
			body?.header,
			body?.content,
		)
	))
})

app.put('/sections/:id', async (req, res) => {
	const { body, params } = req

	await prismaQuery(res, async () => (
		await prisma.section.update(
			Number(params?.id),
			body?.header,
			body?.content,
		)
	))
})

app.put('/sections/:id/move', async (req, res) => {
	await prismaQuery(res, async () => (
		await prisma.section.swap(
			Number(req.params?.id),
			Number(req.body?.newId),
		)
	))
})

app.delete('/jobs/:jobId/sections/:id', async (req, res) => {
	await prismaQuery(res, async () => (
		await prisma.section.delete(
			Number(req.params?.jobId),
			Number(req.params?.id),
		)
	))
})

app.get('/colors', async (req, res) => {
	await prismaQuery(res, prisma.prismaColor.findMany)
})

app.get('/highlights', async (req, res) => {
	await prismaQuery(res, prisma.highlight.findMany)
})

app.post('/highlights', async (req, res) => {
	const body = req.body

	await prismaQuery(res, async () => (
		await prisma.highlight.create(
			body?.label,
			body?.keywords,
			body?.color,
		)
	))
})

app.put('/highlights/:labelId', async (req, res) => {
	const { body, params } = req

	await prismaQuery(res, async () => (
		await prisma.highlight.update(
			Number(params?.labelId),
			body?.label,
			body?.keywords,
		)
	))
})

app.put('/highlights/:labelId/colors/:colorId', async (req, res) => {
	const { body, params } = req

	await prismaQuery(res, async () => (
		await prisma.highlight.updateColor(
			Number(params?.labelId),
			Number(params?.colorId),
			body?.isUpdatingColor,
			body?.color,
		)
	))
})

app.delete('/highlights/:labelId', async (req, res) => {
	await prismaQuery(res, async () => await prisma.highlight.delete(Number(req.params?.labelId)))
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
