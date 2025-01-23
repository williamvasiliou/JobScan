import { PrismaClient } from '@prisma/client'

import { fromPrisma, newTitle, newContent } from './Content'

export const prisma = new PrismaClient()

export const job = {
	findMany: async () => (await prisma.job.findMany({
		include: {
			sections: true,
		},
	})).map(fromPrisma),
	create: async (title, url, header, content) => {
		if (typeof(title) !== 'string' || typeof(url) !== 'string' || typeof(header) !== 'string' || typeof(content) !== 'string') {
			return false
		}

		const jobTitle = newTitle(title)
		const jobUrl = url.trim()
		const jobHeader = newTitle(header)
		const jobContent = newContent(content)

		if (jobTitle && jobHeader && jobContent) {
			const job = await prisma.job.create({
				data: {
					title: newTitle(title),
					url: jobUrl,
					sections: {
						create: [{
							header: newTitle(header),
							content: newContent(content),
						}],
					},
				},
			})

			return fromPrisma(await prisma.job.findUnique({
				where: {
					id: job.id,
				},
				include: {
					sections: true,
				},
			}))
		}

		return false
	},
}
