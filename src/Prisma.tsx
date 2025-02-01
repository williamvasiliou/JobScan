import { PrismaClient } from '@prisma/client'

import { newTitle, newContent, newDate, newTime } from './Content'
import { newKeywords } from './Keyword'
import { TITLE, URL, HEADER, CONTENT, CREATED, UPDATED, PUBLISHED, DATE, MAX, noText, noDate } from './Search'

import { jobTake } from './Fetch'

const prisma = new PrismaClient()

const sectionSelect = {
	id: true,
	header: true,
	content: true,
}

const jobSelect = {
	id: true,
	title: true,
	url: true,
	createdAt: true,
	updatedAt: true,
	published: true,
	sections: {
		select: sectionSelect,
	},
}

const jobContains = (item, search) => ({
	[item]: {
		contains: search,
	},
})

const jobWhereOR = (OR) => OR.length > 1 ? { OR } : OR[0]
const jobSectionsOR = (OR) => ({
	sections: {
		some: jobWhereOR(OR),
	},
})

const jobSearchTextWhere = (search, bits) => {
	if (!search) {
		return false
	}

	const hasTitle = !!(bits & TITLE)
	const hasUrl = !!(bits & URL)
	const hasHeader = !!(bits & HEADER)
	const hasContent = !!(bits & CONTENT)

	if (hasTitle || hasUrl || hasHeader || hasContent) {
		const whereOR = []
		const sectionsOR = []

		if (hasTitle) {
			whereOR.push(jobContains('title', search))
		}

		if (hasUrl) {
			whereOR.push(jobContains('url', search))
		}

		if (hasHeader) {
			sectionsOR.push(jobContains('header', search))
		}

		if (hasContent) {
			sectionsOR.push(jobContains('content', search))
		}

		const whereLength = whereOR.length > 0
		const sectionsLength = sectionsOR.length > 0

		if (whereLength && sectionsLength) {
			whereOR.push(jobSectionsOR(sectionsOR))

			return {
				OR: whereOR,
			}
		} else if (whereLength) {
			return jobWhereOR(whereOR)
		} else if (sectionsLength) {
			return jobSectionsOR(sectionsOR)
		}
	}

	return false
}

const newDateTime = (dateTime) => {
	if (typeof(dateTime) === 'string') {
		const newDateTime = dateTime.trim().split(' ')
		const { length } = newDateTime

		if (length === 1) {
			const [ date ] = newDateTime
			const jobDate = newDate(date)

			if (jobDate) {
				return {
					date: jobDate,
					time: '00:00',
				}
			}
		} else if (length === 2) {
			const [ date, time ] = newDateTime
			const jobDate = newDate(date)
			const jobTime = newTime(time)

			if (jobDate && jobTime) {
				return {
					date: jobDate,
					time: jobTime,
				}
			}
		}
	}

	return false
}

const jobNewDate = (date, time) => new Date(`${date} ${time}`.trim())

const jobDateItem = {
	[CREATED]: 'createdAt',
	[UPDATED]: 'updatedAt',
	[PUBLISHED]: 'published',
}

const jobSearchDateWhere = (start, end, bits) => {
	const startDateTime = newDateTime(start)
	const endDateTime = newDateTime(end)

	if (startDateTime || endDateTime) {
		const whereAND = []
		const item = jobDateItem[bits & DATE] || 'createdAt'

		if (startDateTime) {
			const { date, time } = startDateTime

			whereAND.push({
				gte: jobNewDate(date, time),
			})
		}

		if (endDateTime) {
			const { date, time } = endDateTime

			whereAND.push({
				lte: jobNewDate(date, time),
			})
		}

		if (whereAND.length > 0) {
			return {
				[item]: whereAND.reduce((items, item) => ({
					...items,
					...item,
				})),
			}
		}
	}

	return false
}

export const job = {
	findUnique: async (id) => await prisma.job.findUniqueOrThrow({
		where: {
			id: id,
		},
		select: jobSelect,
	}),
	findManyWhereOrderById: async (where, id) => await prisma.job.findMany({
		where: where,
		orderBy: { id },
		take: jobTake,
	}),
	findManyWhere: async (where, after, id) => {
		if (after) {
			if (id > 0) {
				where.id = {
					lt: id,
				}
			}

			return await job.findManyWhereOrderById(where, 'desc')
		} else {
			if (id > 0) {
				where.id = {
					gt: id,
				}
			}

			return (await job.findManyWhereOrderById(where, 'asc')).reverse()
		}
	},
	findManyWhereAdvanced: async (where, after, id) => {
		if (where) {
			return await job.findManyWhere(where, after, id)
		} else {
			return await job.findManyStart(after, id)
		}
	},
	findManySearchSimple: async (search, after, id) => {
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
					sections: sections,
				},
			],
		}

		return await job.findManyWhere(where, after, id)
	},
	findManySearch: async (search, start, end, filter, after, id) => {
		const bits = filter & MAX

		if (bits > 0) {
			const hasNoText = noText(bits)
			const hasNoDate = noDate(bits)

			if (hasNoText && hasNoDate) {
				return await job.findManyStart(after, id)
			} else if (hasNoText) {
				const where = jobSearchDateWhere(start, end, bits)

				return await job.findManyWhereAdvanced(where, after, id)
			} else if (hasNoDate) {
				const where = jobSearchTextWhere(search, bits)

				return await job.findManyWhereAdvanced(where, after, id)
			} else {
				const whereDate = jobSearchDateWhere(start, end, bits)
				const whereText = jobSearchTextWhere(search, bits)

				if (whereDate && whereText) {
					const where = {
						AND: [
							whereDate,
							whereText,
						],
					}

					return await job.findManyWhere(where, after, id)
				} else if (whereDate) {
					return await job.findManyWhere(whereDate, after, id)
				} else if (whereText) {
					return await job.findManyWhere(whereText, after, id)
				} else {
					return await job.findManyStart(after, id)
				}
			}
		} else {
			return await job.findManySearchSimple(search, after, id)
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
				select: jobSelect,
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
				select: {
					title: true,
					url: true,
					updatedAt: true,
				},
			})
		}

		return false
	},
	updatePublished: async (id, date, time) => {
		if (isNaN(id) || typeof(date) !== 'string' || typeof(time) !== 'string') {
			return false
		}

		const dateTrim = date.trim()
		const timeTrim = time.trim()

		if (!dateTrim && !timeTrim) {
			return await prisma.job.update({
				where: {
					id: id,
				},
				data: {
					published: null,
				},
				select: {
					updatedAt: true,
					published: true,
				},
			})
		} else {
			const jobDate = newDate(dateTrim)
			const jobTime = newTime(timeTrim)

			if (jobDate && jobTime) {
				return await prisma.job.update({
					where: {
						id: id,
					},
					data: {
						published: jobNewDate(jobDate, jobTime),
					},
					select: {
						updatedAt: true,
						published: true,
					},
				})
			}
		}

		return false
	},
	updateUpdatedAt: async (id) => await prisma.job.update({
		where: {
			id: id,
		},
		data: {
			updatedAt: new Date(),
		},
	}),
}

export const section = {
	findUnique: async(id) => await prisma.section.findUniqueOrThrow({
		where: {
			id: id,
		},
		select: sectionSelect,
	}),
	create: async (jobId, header, content) => {
		if (isNaN(jobId) || typeof(header) !== 'string' || typeof(content) !== 'string') {
			return false
		}

		const sectionHeader = newTitle(header)
		const sectionContent = newContent(content)

		if (sectionHeader && sectionContent) {
			const section = await prisma.section.create({
				data: {
					jobId: jobId,
					header: sectionHeader,
					content: sectionContent,
				},
				select: sectionSelect,
			})

			if (section) {
				await job.updateUpdatedAt(jobId)
			} else {
				return false
			}

			return section
		}

		return false
	},
	update: async (id, header, content) => {
		if (isNaN(id) || typeof(header) !== 'string' || typeof(content) !== 'string') {
			return false
		}

		const { jobId } = await prisma.section.findUniqueOrThrow({
			where: {
				id: id,
			},
			select: {
				jobId: true,
			},
		})

		const sectionHeader = newTitle(header)
		const sectionContent = newContent(content)

		if (sectionHeader && sectionContent) {
			const section = await prisma.section.update({
				where: {
					id: id,
				},
				data: {
					header: sectionHeader,
					content: sectionContent,
				},
				select: sectionSelect,
			})

			if (section) {
				await job.updateUpdatedAt(jobId)
			} else {
				return false
			}

			return section
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
				jobId: true,
			},
		})

		const newSection = await prisma.section.findUniqueOrThrow({
			where: {
				id: newId,
			},
			select: {
				header: true,
				content: true,
				jobId: true,
			},
		})

		if (section && newSection && section.jobId === newSection.jobId) {
			const sections = [
				await prisma.section.update({
					where: {
						id: id,
					},
					data: {
						header: newSection.header,
						content: newSection.content,
					},
					select: {
						header: true,
						content: true,
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
					select: {
						header: true,
						content: true,
					},
				})
			]

			if (sections.every((section) => section)) {
				await job.updateUpdatedAt(section.jobId)
			} else {
				return false
			}

			return sections
		}

		return false
	},
	delete: async (id) => {
		if (isNaN(id)) {
			return
		}

		const { jobId } = await prisma.section.findUniqueOrThrow({
			where: {
				id: id,
			},
		})

		const count = await prisma.section.count({
			where: {
				jobId: jobId,
			},
			take: 2,
		})

		if (count > 1) {
			const section = await prisma.section.delete({
				where: {
					id: id,
				},
				select: sectionSelect,
			})

			if (section) {
				await job.updateUpdatedAt(jobId)
			} else {
				return false
			}

			return section
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

async function uniqueKeywords(labelId, keywords) {
	const { length } = keywords

	if (length > 0) {
		const subsets = await prisma.keywordsOnLabels.groupBy({
			by: 'labelId',
			where: {
				keyword: {
					is: {
						keyword: {
							in: keywords,
						},
					},
				},
			},
			_count: {
				keywordId: true,
			},
			having: {
				keywordId: {
					_count: {
						equals: length,
					},
				},
			},
		})

		const where = {
			labelId: {
				in: subsets.map(({ labelId }) => labelId),
			},
		}

		if (labelId > 0) {
			where.labelId.not = labelId
		}

		const sets = await prisma.keywordsOnLabels.groupBy({
			by: 'labelId',
			where: where,
			_count: {
				keywordId: true,
			},
			having: {
				keywordId: {
					_count: {
						equals: length,
					},
				},
			},
			orderBy: {
				labelId: 'asc',
			},
			take: 1,
		})

		return !sets.length
	}

	return false
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
		const highlightUnique = await uniqueKeywords(0, highlightKeywords)

		if (highlightLabel && highlightUnique) {
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
		const highlightUnique = await uniqueKeywords(labelId, highlightKeywords)

		if (highlightLabel && highlightUnique) {
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
