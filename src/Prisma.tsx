import { PrismaClient } from '@prisma/client'

import { fromPrisma, newTitle, newContent } from './Content'

const prisma = new PrismaClient()

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

export const base = 'http://localhost:5173'

export async function fetchCreate(resource, body) {
	const response = await fetch(`${base}${resource}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	})

	if (response.ok) {
		return await response.json()
	}

	return false
}

export async function fetchRead(resource) {
	const response = await fetch(`${base}${resource}`)

	if (response.ok) {
		return await response.json()
	}

	return false
}

export async function fetchUpdate(resource, body) {
	const response = await fetch(`${base}${resource}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	})

	if (response.ok) {
		return await response.json()
	}

	return false
}

export async function fetchDelete(resource) {
	const response = await fetch(`${base}${resource}`, {
		method: 'DELETE',
	})

	if (response.ok) {
		return await response.json()
	}

	return false
}
