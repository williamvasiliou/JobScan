import { PrismaClient } from '@prisma/client'

import { newTitle, newContent } from './Content'
import { newKeywords } from './Keyword'
import { jobTake } from './Fetch'

const prisma = new PrismaClient()

export const job = {
	findUnique: async (id) => await prisma.job.findUniqueOrThrow({
		where: {
			id: id,
		},
		include: {
			sections: true,
		},
	}),
	findManySearch: async (search, after, id) => {
		const sections = {
			some: {
				OR: [
					{
						header: {
							contains: search,
						},
					},
					{
						content: {
							contains: search,
						},
					},
				],
			},
		}

		const where = {
			where: {
				OR: [
					{
						title: {
							contains: search,
						},
					},
					{
						url: {
							contains: search,
						},
					},
					{
						sections: {
							...sections,
						},
					},
				],
			},
		}

		if (after) {
			if (id > 0) {
				where.where.id = {
					lt: id,
				}
			}

			return await prisma.job.findMany({
				...where,
				orderBy: {
					id: 'desc',
				},
				take: jobTake,
			})
		} else {
			if (id > 0) {
				where.where.id = {
					gt: id,
				}
			}

			return (await prisma.job.findMany({
				...where,
				orderBy: {
					id: 'asc',
				},
				take: jobTake,
			})).reverse()
		}
	},
	findManyStart: async (after, id) => (after ? (
			await prisma.job.findMany({
				where: {
					id: {
						lt: id,
					},
				},
				orderBy: {
					id: 'desc',
				},
				take: jobTake,
			})
		) : (
			(await prisma.job.findMany({
				where: {
					id: {
						gt: id,
					},
				},
				orderBy: {
					id: 'asc',
				},
				take: jobTake,
			})).reverse()
		)
	),
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
	const css = []
	const trim = color.trim().toLowerCase()
	const regex = /[a-f0-9]/

	for (const character of trim) {
		if (regex.test(character)) {
			css.push(character)

			if (css.length > 6) {
				return false
			}
		} else {
			return false
		}
	}

	if (css.length === 6) {
		return css.join('')
	}

	return false
}

export const prismaColor = {
	findMany: async () => await prisma.color.findMany(),
	create: async (color) => {
		if (typeof(color) !== 'string') {
			return false
		}

		const css = newColor(color)

		if (css) {
			return await prisma.color.upsert({
				where: {
					color: css,
				},
				update: {
				},
				create: {
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

		if (!await prisma.label.count({
			where: {
				colorId: id,
			},
			take: 1,
		})) {
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
	updateColor: async (id, colorId) => await prisma.label.update({
		where: {
			id: id,
		},
		data: {
			colorId: colorId,
		},
	}),
	delete: async (id) => {
		const label = await prisma.label.delete({
			where: {
				id: id,
			},
		})

		await prismaColor.delete(label.colorId)

		return label
	},
}

const keyword = {
	upsert: async (keywords) => (
		await Promise.all(keywords.map(async (keyword) => (
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
		)))
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

		const keepId = keep.map(({ id }) => id)

		const deletedKeywords = keywords.filter((id) => (
			keepId.indexOf(id.keywordId) === -1
		))

		await Promise.all(deletedKeywords.map(async (id) => {
			const { keywordId } = id

			if (!await prisma.keywordsOnLabels.count({
				where: {
					keywordId: keywordId,
				},
				take: 1,
			})) {
				await keyword.delete(keywordId)
			}
		}))

		return keywords
	},
}

export const highlight = {
	findMany: async () => await prisma.label.findMany({
		include: {
			keywords: {
				select: {
					keyword: {
						select: {
							keyword: true,
						},
					},
				},
			},
		},
		orderBy: {
			label: 'asc',
		},
	}),
	create: async (label, keywords, color) => {
		if (typeof(label) !== 'string' || typeof(keywords) !== 'string') {
			return false
		}

		const highlightLabel = newTitle(label)
		const highlightKeywords = newKeywords(keywords)

		if (highlightLabel && highlightKeywords.length > 0) {
			const newColor = await prismaColor.create(color)
			const newLabel = await prismaLabel.create(highlightLabel, newColor.id)

			if (newLabel) {
				const newKeywords = await keyword.upsert(highlightKeywords)

				if (newKeywords) {
					await keywordsOnLabels.createMany(newLabel.id, newKeywords)

					newLabel.color = newColor
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
	updateColor: async (labelId, colorId, isUpdatingColor, color) => {
		if (typeof(isUpdatingColor) !== 'boolean') {
			return false
		}

		if (isUpdatingColor) {
			const newColor = await prisma.color.findUnique({
				where: {
					color: color,
				},
			})

			if (newColor) {
				const id = newColor.id

				if (id === colorId) {
					return newColor
				} else {
					await prisma.label.updateMany({
						where: {
							colorId: id,
						},
						data: {
							colorId: colorId,
						},
					})

					await prisma.color.delete({
						where: { id },
					})

					return await prismaColor.update(colorId, color)
				}
			} else {
				return await prismaColor.update(colorId, color)
			}
		} else {
			const newColor = await prismaColor.create(color)
			const id = newColor.id

			if (id !== colorId) {
				await prismaLabel.updateColor(labelId, id)
				await prismaColor.delete(colorId)
			}

			return newColor
		}
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
