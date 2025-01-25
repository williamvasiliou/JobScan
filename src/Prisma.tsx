import { PrismaClient } from '@prisma/client'

import { newTitle, newContent } from './Content'

const prisma = new PrismaClient()

export const jobTake = 5

export const job = {
	findUnique: async (id) => await prisma.job.findUniqueOrThrow({
		where: {
			id: id,
		},
		include: {
			sections: true,
		},
	}),
	findUniqueSelect: async (id) => await prisma.job.findUnique({
		where: {
			id: id,
		},
		select: {
			id: true,
		},
	}),
	findManyStart: async (id) => await prisma.job.findMany({
		where: {
			id: {
				lte: id,
			},
		},
		orderBy: {
			id: 'desc',
		},
		take: jobTake,
	}),
	findMany: async () => await prisma.job.findMany({
		orderBy: {
			id: 'desc',
		},
		take: jobTake,
	}),
	create: async (title, url, header, content) => {
		if (typeof(title) !== 'string' || typeof(url) !== 'string' || typeof(header) !== 'string' || typeof(content) !== 'string') {
			return false
		}

		const jobTitle = newTitle(title)
		const jobUrl = url.trim()
		const jobHeader = newTitle(header)
		const jobContent = newContent(content)

		if (jobTitle && jobHeader && jobContent) {
			return await prisma.job.create({
				data: {
					title: jobTitle,
					url: jobUrl,
					sections: {
						create: [{
							header: jobHeader,
							content: jobContent,
						}],
					},
				},
				include: {
					sections: true,
				},
			})
		}

		return false
	},
	update: async (id, title, url) => {
		if (isNaN(id) || typeof(title) !== 'string' || typeof(url) !== 'string') {
			return false
		}

		const jobTitle = newTitle(title)
		const jobUrl = url.trim()

		if (jobTitle) {
			return await prisma.job.update({
				where: {
					id: id,
				},
				data: {
					title: jobTitle,
					url: jobUrl,
				},
			})
		}

		return false
	},
}

export const section = {
	findUnique: async(id) => await prisma.section.findUniqueOrThrow({
		where: {
			id: id,
		},
	}),
	create: async (jobId, header, content) => {
		if (isNaN(jobId) || typeof(header) !== 'string' || typeof(content) !== 'string') {
			return false
		}

		const sectionHeader = newTitle(header)
		const sectionContent = newContent(content)

		if (sectionHeader && sectionContent) {
			return await prisma.section.create({
				data: {
					jobId: jobId,
					header: sectionHeader,
					content: sectionContent,
				},
			})
		}

		return false
	},
	update: async (id, header, content) => {
		if (isNaN(id) || typeof(header) !== 'string' || typeof(content) !== 'string') {
			return false
		}

		const sectionHeader = newTitle(header)
		const sectionContent = newContent(content)

		if (sectionHeader && sectionContent) {
			return await prisma.section.update({
				where: {
					id: id,
				},
				data: {
					header: sectionHeader,
					content: sectionContent,
				},
			})
		}

		return false
	},
	swap: async (id, newId) => {
		if (isNaN(id) || isNaN(newId) || id === newId) {
			return false
		}

		const section = await prisma.section.findUniqueOrThrow({
			where: {
				id: id,
			},
			select: {
				header: true,
				content: true,
			},
		})

		const newSection = await prisma.section.findUniqueOrThrow({
			where: {
				id: newId,
			},
			select: {
				header: true,
				content: true,
			},
		})

		if (section && newSection) {
			return [
				await prisma.section.update({
					where: {
						id: id,
					},
					data: {
						header: newSection.header,
						content: newSection.content,
					},
				}),
				await prisma.section.update({
					where: {
						id: newId,
					},
					data: {
						header: section.header,
						content: section.content,
					},
				})
			]
		}

		return false
	},
	delete: async (jobId, id) => {
		if (isNaN(jobId) || isNaN(id)) {
			return
		}

		const count = await prisma.section.count({
			where: {
				jobId: jobId,
			},
			take: 2,
		})

		if (count > 1) {
			return await prisma.section.delete({
				where: {
					id: id,
				},
			})
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
