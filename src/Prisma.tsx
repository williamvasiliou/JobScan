import { PrismaClient } from '@prisma/client'

import { newTitle, newContent } from './Content'
import { newKeywords } from './Keyword'

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

function newColor (color) {
	return color.trim()
}

export const color = {
	findMany: async () => await prisma.color.findMany(),
	create: async (color) => {
		if (typeof(color) !== 'string') {
			return false
		}

		const css = newColor(color)

		if (css) {
			return await prisma.color.create({
				data: {
					color: css,
				},
			})
		}

		return false
	},
	update: async (id, color) => {
		if (isNaN(id) || typeof(color) !== 'string') {
			return false
		}

		const css = newColor(color)

		if (css) {
			return await prisma.color.update({
				where: {
					id: id,
				},
				data: {
					color: css,
				},
			})
		}

		return false
	},
	delete: async (id) => {
		if (isNaN(id)) {
			return false
		}

		const count = await prisma.color.count({
			take: 2,
		})

		if (count > 1) {
			return await prisma.color.delete({
				where: {
					id: id,
				},
			})
		}

		return false
	},
}

const prismaLabel = {
	create: async (label, colorId) => await prisma.label.create({
		data: {
			label: label,
			colorId: colorId,
		},
	}),
	update: async (id, label) => await prisma.label.update({
		where: {
			id: id,
		},
		data: {
			label: label,
		},
	}),
	delete: async (id) => await prisma.label.delete({
		where: {
			id: id,
		},
	}),
}

async function awaitMap(list, item) {
	const items = []

	for (let i = 0; i < list.length; ++i) {
		items.push(await item(list[i]))
	}

	return items
}

async function awaitEach(list, item) {
	for (let i = 0; i < list.length; ++i) {
		await item(list[i])
	}
}

const keyword = {
	upsert: async (keywords) => (
		await awaitMap(keywords, async (keyword) => (
			await prisma.keyword.upsert({
				where: {
					keyword: keyword,
				},
				update: {
				},
				create: {
					keyword: keyword,
				},
			})
		))
	),
	delete: async (id) => await prisma.keyword.delete({
		where: {
			id: id,
		},
	}),
}

const keywordsOnLabels = {
	createMany: async (labelId, keywords) => (
		await prisma.keywordsOnLabels.createMany({
			data: keywords.map((keyword) => ({
				labelId: labelId,
				keywordId: keyword.id,
			})),
		})
	),
	deleteMany: async (labelId, keep) => {
		const keywords = await prisma.keywordsOnLabels.findMany({
			where: {
				labelId: labelId,
			},
			select: {
				keywordId: true,
			},
		})

		await prisma.keywordsOnLabels.deleteMany({
			where: {
				labelId: labelId,
			},
		})

		const keepId = keep.map((keyword) => keyword.id)

		const deletedKeywords = keywords.filter((id) => (
			keepId.indexOf(id.keywordId) === -1
		))

		await awaitEach(deletedKeywords, async (id) => {
			const { keywordId } = id

			if (!await prisma.keywordsOnLabels.count({
				where: {
					keywordId: keywordId,
				},
				take: 1,
			})) {
				await keyword.delete(keywordId)
			}
		})

		return keywords
	},
}

export const highlight = {
	findMany: async () => await prisma.label.findMany({
		include: {
			keywords: {
				select: {
					keyword: true,
				},
			},
		},
		orderBy: {
			label: 'asc',
		},
	}),
	create: async (label, keywords) => {
		if (typeof(label) !== 'string' || typeof(keywords) !== 'string') {
			return false
		}

		const highlightLabel = newTitle(label)
		const highlightKeywords = newKeywords(keywords)

		if (highlightLabel && highlightKeywords.length > 0) {
			const newLabel = await prismaLabel.create(highlightLabel, 1)

			if (newLabel) {
				const newKeywords = await keyword.upsert(highlightKeywords)

				if (newKeywords) {
					await keywordsOnLabels.createMany(newLabel.id, newKeywords)

					return [newLabel, newKeywords]
				}
			}
		}

		return false
	},
	update: async (labelId, label, keywords) => {
		if (isNaN(labelId) || typeof(label) !== 'string' || typeof(keywords) !== 'string') {
			return false
		}

		const highlightLabel = newTitle(label)
		const highlightKeywords = newKeywords(keywords)

		if (highlightLabel && highlightKeywords.length > 0) {
			const newLabel = await prismaLabel.update(labelId, highlightLabel)

			if (newLabel) {
				const newKeywords = await keyword.upsert(highlightKeywords)

				await keywordsOnLabels.deleteMany(labelId, newKeywords)
				await keywordsOnLabels.createMany(labelId, newKeywords)

				return [newLabel, newKeywords]
			}
		}

		return false
	},
	delete: async (labelId) => {
		if (isNaN(labelId)) {
			return false
		}

		if (await keywordsOnLabels.deleteMany(labelId, [])) {
			return await prismaLabel.delete(labelId)
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
