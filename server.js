const prismaQuery = async (res, query) => {
	try {
		const json = await query()

		if (json) {
			res.status(200).json(json)
		} else {
			throw new Error()
		}
	} catch (e) {
		console.log(e)
		res.status(500).json({})
	}
}

export function middleware(app, prisma) {
	app.get('/jobs', async (req, res) => {
		try {
			const search = req.query.q?.trim() || ''

			const start = req.query?.start
			const end = req.query?.end
			const filter = ((filter) => !isNaN(filter) && filter > 0 ? filter : 0)(Number(req.query?.filter))

			const before = Number(req.query?.before)
			const after = Number(req.query?.after)

			const hasSearch = search || start || end || filter > 0

			if (isNaN(before) && isNaN(after)) {
				if (hasSearch) {
					res.status(200).json(await prisma.job.findManySearch(search, start, end, filter, true, 0))
				} else {
					res.status(200).json(await prisma.job.findMany())
				}
			} else if (isNaN(before)) {
				if (hasSearch) {
					res.status(200).json(await prisma.job.findManySearch(search, start, end, filter, true, after))
				} else {
					res.status(200).json(await prisma.job.findManyStart(true, after))
				}
			} else if (isNaN(after)) {
				if (hasSearch) {
					res.status(200).json(await prisma.job.findManySearch(search, start, end, filter, false, before))
				} else {
					res.status(200).json(await prisma.job.findManyStart(false, before))
				}
			} else {
				throw new Error()
			}
		} catch(e) {
			console.log(e)
			res.status(500).json({})
		}
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

	app.put('/jobs/:id/published', async (req, res) => {
		const { body, params } = req

		await prismaQuery(res, async () => (
			await prisma.job.updatePublished(
				Number(params?.id),
				body?.date,
				body?.time,
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

	app.delete('/sections/:id', async (req, res) => {
		await prismaQuery(res, async () => await prisma.section.delete(Number(req.params?.id)))
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
}
