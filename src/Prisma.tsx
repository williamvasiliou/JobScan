import { PrismaClient } from '@prisma/client'

import { newTitle, newContent, newDate, newTime } from './Content'
import { unique, newKeywords, newRegex } from './Keyword'
import { TITLE, URL, HEADER, CONTENT, TEXT, CREATED, UPDATED, PUBLISHED, DATE, MAX, noText, noDate } from './Search'

import { jobTake, analysisTake } from './Fetch'

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

const jobSearchSimpleWhere = (search) => (search ? {
	OR: [
		jobContains('title', search),
		jobContains('url', search),
		{
			sections: {
				some: {
					OR: [
						jobContains('header', search),
						jobContains('content', search),
					],
				},
			},
		},
	],
} : false)

const jobWhereOR = (OR) => OR.length > 1 ? { OR } : OR[0]
const jobSectionsOR = (OR) => ({
	sections: {
		some: jobWhereOR(OR),
	},
})

const jobSearchTextWhere = (text, bits) => {
	const search = newTitle(text)

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
	findUnique: async (id) => {
		const job = await prisma.job.findUniqueOrThrow({
			where: { id },
			select: jobSelect,
		})

		const previous = await prisma.job.findFirst({
			where: {
				id: {
					lt: id,
				},
			},
			orderBy: {
				id: 'desc',
			},
			select: {
				id: true,
			},
		})

		const next = await prisma.job.findFirst({
			where: {
				id: {
					gt: id,
				},
			},
			orderBy: {
				id: 'asc',
			},
			select: {
				id: true,
			},
		})

		return {
			...job,
			previous,
			next,
		}
	},
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
	findManyWhereOrStart: async (where, after, id) => (where ? (
		await job.findManyWhere(where, after, id)
	) : (
		await job.findManyStart(after, id)
	)),
	findManySearchSimple: async (search, after, id) => (
		await job.findManyWhereOrStart(jobSearchSimpleWhere(search), after, id)
	),
	findManySearch: async (search, start, end, filter, after, id) => {
		const bits = filter & MAX

		if (bits > 0) {
			const hasNoText = noText(bits)
			const hasNoDate = noDate(bits)

			if (hasNoText && hasNoDate) {
				return await job.findManyStart(after, id)
			} else if (hasNoText) {
				const where = jobSearchDateWhere(start, end, bits)

				return await job.findManyWhereOrStart(where, after, id)
			} else if (hasNoDate) {
				const where = jobSearchTextWhere(search, bits)

				return await job.findManyWhereOrStart(where, after, id)
			} else {
				const whereDate = jobSearchDateWhere(start, end, bits)
				const whereText = jobSearchTextWhere(search, bits)

				if (whereDate && whereText) {
					const where = {
						...whereDate,
						...whereText,
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
	findManyStart: async (after, id) => (id > 0 ? (after ? (
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
	)) : (
		await job.findMany()
	)),
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
			await analysis.updateJob(id)

			return await prisma.job.update({
				where: { id },
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
			await analysis.updateJob(id)

			return await prisma.job.update({
				where: { id },
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
				await analysis.updateJob(id)

				return await prisma.job.update({
					where: { id },
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
	updateUpdatedAt: async (id) => {
		await analysis.updateJob(id)

		await prisma.job.update({
			where: { id },
			data: {
				updatedAt: new Date(),
			},
			select: {
				updatedAt: true,
			},
		})
	},
}

export const section = {
	findUnique: async(id) => await prisma.section.findUniqueOrThrow({
		where: { id },
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
					jobId,
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
			where: { id },
			select: {
				jobId: true,
			},
		})

		const sectionHeader = newTitle(header)
		const sectionContent = newContent(content)

		if (sectionHeader && sectionContent) {
			const section = await prisma.section.update({
				where: { id },
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
			where: { id },
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
					where: { id },
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
			where: { id },
		})

		const count = await prisma.section.count({
			where: { jobId },
			take: 2,
		})

		if (count > 1) {
			const section = await prisma.section.delete({
				where: { id },
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
			await analysis.updateColor(id)

			const labels = await prisma.label.findMany({
				where: {
					colorId: id,
					labels: {
						some: {
							labelLabel: null,
						},
					},
				},
				select: {
					id: true,
					label: true,
				},
			})

			await analysis.updateManyLabel(labels)

			return await prisma.color.update({
				where: { id },
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
			await analysis.deleteColor(id)

			return await prisma.color.delete({
				where: { id },
			})
		}

		return false
	},
}

const prismaLabel = {
	create: async (label, colorId) => await prisma.label.create({
		data: {
			label,
			colorId,
		},
	}),
	update: async (id, label) => {
		await analysis.updateLabel(id)

		return await prisma.label.update({
			where: { id },
			data: { label },
		})
	},
	updateColor: async (id, colorId) => {
		await analysis.updateLabel(id)

		return await prisma.label.update({
			where: { id },
			data: { colorId },
			select: {
				colorId: true,
			},
		})
	},
	delete: async (id) => {
		await analysis.deleteLabel(id)

		const label = await prisma.label.delete({
			where: { id },
		})

		await prismaColor.delete(label.colorId)

		return label
	},
}

const keyword = {
	upsert: async (keywords) => (
		await Promise.all(keywords.map(async (keyword) => (
			await prisma.keyword.upsert({
				where: { keyword },
				update: {
				},
				create: { keyword },
			})
		)))
	),
	delete: async (id) => await prisma.keyword.delete({
		where: { id },
	}),
}

const keywordsOnLabels = {
	createMany: async (labelId, keywords) => (
		await prisma.keywordsOnLabels.createMany({
			data: keywords.map((keyword) => ({
				labelId,
				keywordId: keyword.id,
			})),
		})
	),
	deleteMany: async (labelId, keep) => {
		const keywords = await prisma.keywordsOnLabels.findMany({
			where: { labelId },
			select: {
				keywordId: true,
			},
		})

		await prisma.keywordsOnLabels.deleteMany({
			where: { labelId },
		})

		const keepId = keep.map(({ id }) => id)

		const deletedKeywords = keywords.filter((id) => (
			keepId.indexOf(id.keywordId) === -1
		))

		await Promise.all(deletedKeywords.map(async (id) => {
			const { keywordId } = id

			if (!await prisma.keywordsOnLabels.count({
				where: { keywordId },
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
			where,
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
				where: { color },
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
						data: { colorId },
					})

					await analysis.deleteColor(id)

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

const analysisSelect = {
	id: true,
	title: true,
	createdAt: true,
}

const analysisJobSelect = {
	id: true,
}

const analysisCreateDateCreated = async (orderBy) => {
	const { createdAt } = await prisma.job.findFirst({
		select: {
			createdAt: true,
		},
		orderBy: {
			createdAt: orderBy,
		},
	})

	return {
		isPublished: false,
		date: createdAt,
	}
}

const analysisCreateDateItem = async (where, item, orderBy) => {
	const job = where ? (await prisma.job.findFirst({
		where,
		select: {
			[item]: true,
		},
		orderBy: {
			[item]: orderBy,
		},
	})) : (await prisma.job.findFirst({
		select: {
			[item]: true,
		},
		orderBy: {
			[item]: orderBy,
		},
	}))

	return {
		isPublished: false,
		date: job[item],
	}
}

const analysisCreateDatePublished = async (where, orderBy) => {
	if (!where || !where.published) {
		return await analysisCreateDateCreated(orderBy)
	}

	const job = await prisma.job.findFirst({
		where: {
			...where,
			published: {
				...where.published,
				not: null,
			},
		},
		select: {
			published: true,
		},
		orderBy: {
			published: orderBy,
		},
	})

	if (job) {
		return {
			isPublished: true,
			date: job.published,
		}
	}

	return await analysisCreateDateItem(where, 'createdAt', orderBy)
}

const analysisCreateDate = async (dateTime, where, item, isPublished, orderBy) => {
	if (dateTime) {
		const { date, time } = dateTime

		return {
			isPublished,
			date: jobNewDate(date, time),
		}
	} else if (isPublished) {
		return await analysisCreateDatePublished(where, orderBy)
	} else {
		return await analysisCreateDateItem(where, item, orderBy)
	}
}

const analysisColorsReduce = (colors, { id, colorId }) => ({
	...colors,
	[colorId]: id,
})

const analysisLabelsReduce = (labels, { id, labelId }) => ({
	...labels,
	[labelId]: id,
})

const analysisLabelsIdReduce = (labels, newLabels) => [
	...labels,
	...newLabels,
]

const analysisJobsReduce = (jobs, { id, jobId }) => ({
	...jobs,
	[jobId]: id,
})

const analysisCreateLabelsOnJobs = async (analysisId, jobsId) => {
	const sections = await prisma.section.findMany({
		where: {
			jobId: {
				in: jobsId,
			},
		},
		select: {
			content: true,
			jobId: true,
		},
	})

	const content = sections.reduce((items, { content, jobId }) => ({
		...items,
		[jobId]: [
			...(items[jobId] ?? []),
			content,
		],
	}), {})

	const contents = Object.entries(content).map(([ jobId, content ]) => ({
		jobId,
		content: content.join('\n'),
	}))

	const labels = await prisma.label.findMany({
		select: {
			id: true,
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
	})

	const regex = labels.map(({ id, keywords }) => ({
		id,
		regex: newRegex(keywords.map(({ keyword }) => (
			keyword.keyword
		))),
	}))

	const labelsOnJobs = contents.map(({ jobId, content }) => ({
		jobId,
		labels: regex.map(({ id, regex }) => ({
			id,
			regex: regex.test(content),
		})).filter(({ regex }) => regex).map(({ id }) => id),
	}))

	const labelsId = unique(labelsOnJobs.map(({ labels }) => labels).reduce(analysisLabelsIdReduce, []).sort())

	const colorId = await prisma.label.findMany({
		where: {
			id: {
				in: labelsId,
			},
		},
		select: {
			id: true,
			colorId: true,
		},
	})

	const colorsId = unique(colorId.map(({ colorId }) => colorId).sort())

	const analysisColors = await prisma.analysisColor.findMany({
		where: {
			colorId: {
				in: colorsId,
			},
			colorColor: null,
		},
		select: {
			id: true,
			colorId: true,
		},
	})

	const analysisColorsId = analysisColors.map(({ colorId }) => colorId)
	const newColorsId = colorsId.filter((id) => analysisColorsId.indexOf(id) < 0)

	const newAnalysisColors = await prisma.analysisColor.createManyAndReturn({
		data: newColorsId.map((colorId) => ({ colorId })),
		select : {
			id: true,
			colorId: true,
		},
	})

	const colors = {
		...analysisColors.reduce(analysisColorsReduce, {}),
		...newAnalysisColors.reduce(analysisColorsReduce, {}),
	}

	const labelColors = colorId.reduce((labels, { id, colorId }) => ({
		...labels,
		[id]: colors[colorId],
	}), {})

	const analysisLabels = await prisma.analysisLabel.findMany({
		where: {
			labelId: {
				in: labelsId,
			},
			labelLabel: null,
		},
		select: {
			id: true,
			labelId: true,
		},
	})

	const analysisLabelsId = analysisLabels.map(({ labelId }) => labelId)
	const newLabelsId = labelsId.filter((id) => analysisLabelsId.indexOf(id) < 0)

	const newAnalysisLabels = await prisma.analysisLabel.createManyAndReturn({
		data: newLabelsId.map((labelId) => ({
			labelId,
			colorId: labelColors[labelId],
		})),
		select: {
			id: true,
			labelId: true,
		},
	})

	const analysisJobs = await prisma.analysisJob.findMany({
		where: {
			title: null,
			jobId: {
				in: jobsId,
			},
		},
		select: {
			id: true,
			jobId: true,
		},
	})

	const analysisJobsId = analysisJobs.map(({ jobId }) => jobId)
	const newJobsId = jobsId.filter((id) => analysisJobsId.indexOf(id) < 0)

	const newAnalysisJobs = await prisma.analysisJob.createManyAndReturn({
		data: newJobsId.map((jobId) => ({ jobId })),
		select: {
			id: true,
			jobId: true,
		},
	})

	const jobs = {
		labels: {
			...analysisLabels.reduce(analysisLabelsReduce, {}),
			...newAnalysisLabels.reduce(analysisLabelsReduce, {}),
		},
		jobs: {
			...analysisJobs.reduce(analysisJobsReduce, {}),
			...newAnalysisJobs.reduce(analysisJobsReduce, {}),
		},
	}

	const analysisLabelsOnJobsId = labelsOnJobs.map(({ jobId, labels }) => (
		labels.map((id) => [
			jobs.labels[id],
			jobs.jobs[jobId],
		])
	)).reduce(analysisLabelsIdReduce, [])

	const analysisLabelsOnJobs = await prisma.labelsOnJobs.findMany({
		where: {
			OR: analysisLabelsOnJobsId.map(([ analysisLabelId, analysisJobId ]) => ({
				analysisLabelId,
				analysisJobId,
			})),
		},
		select: {
			id: true,
			analysisLabelId: true,
			analysisJobId: true,
		},
	})

	const newAnalysisLabelsOnJobs = analysisLabelsOnJobsId.filter(([ labelId, jobId ]) => (
		!analysisLabelsOnJobs.find(({ analysisLabelId, analysisJobId }) => analysisLabelId === labelId && analysisJobId === jobId)
	)).map(([ analysisLabelId, analysisJobId ]) => ({
		analysisLabelId,
		analysisJobId,
	}))

	const newLabelsOnAnalysis = await prisma.labelsOnJobs.createManyAndReturn({
		data: newAnalysisLabelsOnJobs,
		select: {
			id: true,
		},
	})

	await prisma.labelsOnAnalysis.createMany({
		data: [
			...analysisLabelsOnJobs,
			...newLabelsOnAnalysis,
		].map(({ id }) => ({
			analysisId,
			analysisLabelId: id,
		})),
	})

	await prisma.jobsOnAnalysis.createMany({
		data: labelsOnJobs.filter(({ labels }) => !labels.length).map(({ jobId }) => ({
			analysisId,
			analysisJobId: jobs.jobs[jobId],
		})),
	})
}

const analysisCreate = async (jobs, search, filter, start, end) => {
	const analysis = await prisma.analysis.create({
		data: {
			title: 'Untitled Analysis',
			search,
			filter,
			start,
			end,
		},
		select: analysisSelect,
	})

	await analysisCreateLabelsOnJobs(analysis.id, jobs.map(({ id }) => id))

	return analysis
}

const analysisCreateFromJobs = async (jobs, where, { search, filter, start, end }) => {
	if (jobs.length > 0) {
		const date = filter & DATE

		const item = jobDateItem[date] || 'createdAt'
		const isPublished = date === PUBLISHED

		const startDate = await analysisCreateDate(newDateTime(start), where, item, isPublished, 'asc')
		const endDate = await analysisCreateDate(newDateTime(end), where, item, isPublished, 'desc')

		const isDatePublished = startDate.isPublished && endDate.isPublished

		if (isPublished && !isDatePublished) {
			return await analysisCreate(jobs, search, filter & TEXT, startDate.date, endDate.date)
		} else {
			return await analysisCreate(jobs, search, filter, startDate.date, endDate.date)
		}
	}

	return false
}

const analysisCreateWhere = async (where, analysis) => (where ? (
	await analysisCreateFromJobs(await prisma.job.findMany({
		where,
		select: analysisJobSelect,
	}), where, analysis)
) : (
	await analysisCreateFromJobs(await prisma.job.findMany({
		select: analysisJobSelect,
	}), where, analysis)
))

const analysisCreateSimple = async (search) => await analysisCreateWhere(jobSearchSimpleWhere(search), {
	search,
	filter: 0,
	start: '',
	end: '',
})

const analysisCreateAdvanced = async (search, start, end, bits) => {
	const hasNoText = noText(bits)
	const hasNoDate = noDate(bits)
	const analysis = {
		search,
		filter: bits,
		start,
		end,
	}

	if (hasNoText && hasNoDate) {
		return await analysisCreateWhere(false, analysis)
	} else if (hasNoText) {
		const where = jobSearchDateWhere(start, end, bits)

		return await analysisCreateWhere(where, analysis)
	} else if (hasNoDate) {
		const where = jobSearchTextWhere(search, bits)

		return await analysisCreateWhere(where, analysis)
	} else {
		const whereDate = jobSearchDateWhere(start, end, bits)
		const whereText = jobSearchTextWhere(search, bits)

		if (whereDate && whereText) {
			const where = {
				...whereDate,
				...whereText,
			}

			return await analysisCreateWhere(where, analysis)
		} else if (whereDate) {
			return await analysisCreateWhere(whereDate, analysis)
		} else if (whereText) {
			return await analysisCreateWhere(whereText, analysis)
		} else {
			return await analysisCreateWhere(false, analysis)
		}
	}
}

const analysisSearchSimpleWhere = (search) => search ? jobContains('title', search) : false

const analysisLabelWhere = (where) => ({
	OR: [
		{
			labelLabel: where.label,
		},
		{
			label: where,
		},
	],
})

const analysisLabelContains = (where) => ({
	labels: {
		some: {
			analysisLabel: {
				analysisLabel: analysisLabelWhere(where),
			},
		},
	},
})

const analysisJobWhere = (where) => ({
	OR: [
		where,
		{
			job: where,
		},
	],
})

const analysisJobContains = (where) => {
	const analysisJob = analysisJobWhere(where)

	return [
		{
			jobs: {
				some: {
					analysisJob,
				},
			},
		},
		{
			labels: {
				some: {
					analysisLabel: {
						analysisJob,
					},
				},
			},
		},
	]
}

const analysisSearchTextWhere = (text, bits) => {
	const search = newTitle(text)

	if (!search) {
		return false
	}

	const hasTitle = !!(bits & TITLE)
	const hasUrl = !!(bits & URL)
	const hasHeader = !!(bits & HEADER)
	const hasContent = !!(bits & CONTENT)

	if (hasTitle || hasUrl || hasHeader || hasContent) {
		const whereOR = []

		if (hasTitle) {
			const title = jobContains('title', search)

			whereOR.push({
				OR: [
					title,
					...analysisJobContains(title),
				],
			})
		}

		if (hasUrl) {
			whereOR.push({
				OR: analysisJobContains(jobContains('url', search)),
			})
		}

		if (hasHeader) {
			whereOR.push(jobContains('search', search))
		}

		if (hasContent) {
			whereOR.push(analysisLabelContains(jobContains('label', search)))
		}

		if (whereOR.length > 0) {
			return jobWhereOR(whereOR)
		}
	}

	return false
}

const analysisSearchDateWhere = (start, end, bits) => {
	const where = jobSearchDateWhere(start, end, bits)

	if (where) {
		const gte = where?.gte
		const lte = where?.lte
		const date = {}

		if (gte) {
			date.gte = gte
		}

		if (lte) {
			date.lte = lte
		}

		return {
			OR: [
				{
					createdAt: date,
				},
				{
					start: date,
				},
				{
					end: date,
				},
				...analysisJobContains(where),
			],
		}
	}

	return false
}

const analysisFindManyLabel = async (id) => ({
	...((await prisma.analysisLabel.findMany({
		where: {
			id: {
				in: id,
			},
			labelId: null,
		},
		select: {
			id: true,
			labelLabel: true,
			colorId: true,
		},
	})).reduce((labels, { id, labelLabel, colorId }) => ({
		...labels,
		[id]: {
			previous: labelLabel,
			next: null,
			label: labelLabel,
			colorId,
		},
	}), {})),
	...((await prisma.analysisLabel.findMany({
		where: {
			id: {
				in: id,
			},
			labelId: {
				not: null,
			},
		},
		select: {
			id: true,
			label: {
				select: {
					label: true,
				},
			},
			labelLabel: true,
			colorId: true,
		},
	})).reduce((labels, { id, label, labelLabel, colorId }) => ({
		...labels,
		[id]: {
			previous: labelLabel,
			next: label.label,
			label: labelLabel ?? label.label,
			colorId,
		},
	}), {})),
})

const analysisFindManyColor = async (id) => ({
	...((await prisma.analysisColor.findMany({
		where: {
			id: {
				in: id,
			},
			colorId: null,
		},
		select: {
			id: true,
			colorColor: true,
		},
	})).reduce((colors, { id, colorColor }) => ({
		...colors,
		[id]: {
			previous: colorColor,
			next: null,
		},
	}), {})),
	...((await prisma.analysisColor.findMany({
		where: {
			id: {
				in: id,
			},
			colorId: {
				not: null,
			},
		},
		select: {
			id: true,
			color: {
				select: {
					color: true,
				},
			},
			colorColor: true,
		},
	})).reduce((colors, { id, color, colorColor }) => ({
		...colors,
		[id]: {
			previous: colorColor,
			next: color.color,
		},
	}), {})),
})

const analysisFindManyJob = async (id) => ({
	...((await prisma.analysisJob.findMany({
		where: {
			id: {
				in: id,
			},
			jobId: null,
		},
		select: {
			id: true,
			title: true,
			url: true,
			createdAt: true,
			updatedAt: true,
			published: true,
		},
	})).reduce((jobs, { id, title, url, createdAt, updatedAt, published }) => ({
		...jobs,
		[id]: {
			previous: {
				title,
				url,
				createdAt,
				updatedAt,
				published,
			},
			next: null,
			title,
			url,
			createdAt,
			updatedAt,
			published,
		},
	}), {})),
	...((await prisma.analysisJob.findMany({
		where: {
			id: {
				in: id,
			},
			jobId: {
				not: null,
			},
		},
		select: {
			id: true,
			title: true,
			url: true,
			createdAt: true,
			updatedAt: true,
			published: true,
			job: {
				select: {
					title: true,
					url: true,
					createdAt: true,
					updatedAt: true,
					published: true,
				},
			},
		},
	})).reduce((jobs, { id, title, url, createdAt, updatedAt, published, job }) => ({
		...jobs,
		[id]: {
			previous: title ? {
				title,
				url,
				createdAt,
				updatedAt,
				published,
			} : null,
			next: job,
			title: title ?? job.title,
			url: url ?? job.url,
			createdAt: createdAt ?? job.createdAt,
			updatedAt: updatedAt ?? job.updatedAt,
			published: title ? published : job.published,
		},
	}), {})),
})

export const analysis = {
	findUnique: async (id) => {
		const analysis = await prisma.analysis.findUniqueOrThrow({
			where: { id },
			select: {
				id: true,
				title: true,
				createdAt: true,
				search: true,
				filter: true,
				start: true,
				end: true,
				jobs: {
					select: {
						analysisJobId: true,
					},
				},
				labels: {
					select: {
						analysisLabel: {
							select: {
								analysisLabelId: true,
								analysisJobId: true,
							},
						},
					},
				},
			},
		})

		const analysisLabelsOnJobsId = analysis.labels.map(({ analysisLabel }) => analysisLabel)

		const analysisLabelsOnJobs = analysisLabelsOnJobsId.reduce((jobs, { analysisLabelId, analysisJobId }) => ({
			...jobs,
			[analysisJobId]: [
				...(jobs[analysisJobId] ?? []),
				analysisLabelId,
			],
		}), {})

		const analysisLabelId = unique(analysisLabelsOnJobsId.map(({ analysisLabelId }) => analysisLabelId).sort())
		const analysisLabels = await analysisFindManyLabel(analysisLabelId)

		const analysisColorId = unique(Object.values(analysisLabels).map(({ colorId }) => colorId).sort())

		const analysisJobId = unique([
			...analysis.jobs.map(({ analysisJobId }) => analysisJobId),
			...analysisLabelsOnJobsId.map(({ analysisJobId }) => analysisJobId),
		].sort())

		const previous = await prisma.analysis.findFirst({
			where: {
				id: {
					lt: id,
				},
			},
			orderBy: {
				id: 'desc',
			},
			select: {
				id: true,
			},
		})

		const next = await prisma.analysis.findFirst({
			where: {
				id: {
					gt: id,
				},
			},
			orderBy: {
				id: 'asc',
			},
			select: {
				id: true,
			},
		})

		return {
			...analysis,
			jobs: {
				...analysis.jobs.reduce((jobs, { analysisJobId }) => ({
					...jobs,
					[analysisJobId]: [],
				}), {}),
				...analysisLabelsOnJobs,
			},
			labels: {
				colors: await analysisFindManyColor(analysisColorId),
				labels: analysisLabels,
				jobs: await analysisFindManyJob(analysisJobId),
			},
			previous,
			next,
		}
	},
	findManyWhereOrderById: async (where, id) => await prisma.analysis.findMany({
		where: where,
		orderBy: { id },
		select: analysisSelect,
		take: analysisTake,
	}),
	findManyWhere: async (where, after, id) => {
		if (after) {
			if (id > 0) {
				where.id = {
					lt: id,
				}
			}

			return await analysis.findManyWhereOrderById(where, 'desc')
		} else {
			if (id > 0) {
				where.id = {
					gt: id,
				}
			}

			return (await analysis.findManyWhereOrderById(where, 'asc')).reverse()
		}
	},
	findManyWhereOrStart: async (where, after, id) => (where ? (
		await analysis.findManyWhere(where, after, id)
	) : (
		await analysis.findManyStart(after, id)
	)),
	findManySearchSimple: async (search, after, id) => (
		await analysis.findManyWhereOrStart(analysisSearchSimpleWhere(search), after, id)
	),
	findManySearch: async (search, start, end, filter, after, id) => {
		const bits = filter & MAX

		if (bits > 0) {
			const hasNoText = noText(bits)
			const hasNoDate = noDate(bits)

			if (hasNoText && hasNoDate) {
				return await analysis.findManyStart(after, id)
			} else if (hasNoText) {
				const where = analysisSearchDateWhere(start, end, bits)

				return await analysis.findManyWhereOrStart(where, after, id)
			} else if (hasNoDate) {
				const where = analysisSearchTextWhere(search, bits)

				return await analysis.findManyWhereOrStart(where, after, id)
			} else {
				const whereDate = analysisSearchDateWhere(start, end, bits)
				const whereText = analysisSearchTextWhere(search, bits)

				if (whereDate && whereText) {
					const where = {
						AND: [
							whereDate,
							whereText,
						],
					}

					return await analysis.findManyWhere(where, after, id)
				} else if (whereDate) {
					return await analysis.findManyWhere(whereDate, after, id)
				} else if (whereText) {
					return await analysis.findManyWhere(whereText, after, id)
				} else {
					return await analysis.findManyStart(after, id)
				}
			}
		} else {
			return await analysis.findManySearchSimple(search, after, id)
		}
	},
	findManyStart: async (after, id) => (id > 0 ? (after ? (
		await prisma.analysis.findMany({
			where: {
				id: {
					lt: id,
				},
			},
			orderBy: {
				id: 'desc',
			},
			select: analysisSelect,
			take: analysisTake,
		})
	) : (
		(await prisma.analysis.findMany({
			where: {
				id: {
					gt: id,
				},
			},
			orderBy: {
				id: 'asc',
			},
			select: analysisSelect,
			take: analysisTake,
		})).reverse()
	)) : (
		await analysis.findMany()
	)),
	findMany: async () => await prisma.analysis.findMany({
		orderBy: {
			id: 'desc',
		},
		select: analysisSelect,
		take: analysisTake,
	}),
	create: async (search, start, end, filter) => {
		if (typeof(search) !== 'string' || typeof(start) !== 'string' || typeof(end) !== 'string') {
			return false
		}

		if (isNaN(filter) || filter <= 0) {
			return await analysisCreateSimple(search.trim())
		} else {
			return await analysisCreateAdvanced(search.trim(), start.trim(), end.trim(), filter & MAX)
		}
	},
	update: async (id, title) => {
		if (isNaN(id) || typeof(title) !== 'string') {
			return false
		}

		const analysisTitle = newTitle(title)

		if (analysisTitle) {
			return await prisma.analysis.update({
				where: { id },
				data: {
					title: analysisTitle,
				},
				select: {
					title: true,
				},
			})
		}

		return false
	},
	updateJob: async (jobId) => {
		const {
			title,
			url,
			createdAt,
			updatedAt,
			published,
		} = await prisma.job.findUniqueOrThrow({
			where: {
				id: jobId,
			},
			select: {
				title: true,
				url: true,
				createdAt: true,
				updatedAt: true,
				published: true,
			},
		})

		await prisma.analysisJob.updateMany({
			where: {
				title: null,
				jobId,
			},
			data: {
				title,
				url,
				createdAt,
				updatedAt,
				published,
			},
		})
	},
	updateColor: async (colorId) => {
		const { color } = await prisma.color.findUniqueOrThrow({
			where: {
				id: colorId,
			},
			select: {
				color: true,
			},
		})

		await prisma.analysisColor.updateMany({
			where: {
				colorId,
				colorColor: null,
			},
			data: {
				colorColor: color,
			},
		})
	},
	deleteColor: async (colorId) => {
		await analysis.updateColor(colorId)

		await prisma.analysisColor.updateMany({
			where: { colorId },
			data: {
				colorId: null,
			},
		})
	},
	updateLabel: async (labelId) => {
		const { label } = await prisma.label.findUniqueOrThrow({
			where: {
				id: labelId,
			},
			select: {
				label: true,
			},
		})

		await prisma.analysisLabel.updateMany({
			where: {
				labelId,
				labelLabel: null,
			},
			data: {
				labelLabel: label,
			},
		})
	},
	updateManyLabel: async (labels) => await Promise.all(
		labels.map(async ({ id, label }) => (
			await prisma.analysisLabel.updateMany({
				where: {
					labelId: id,
					labelLabel: null,
				},
				data: {
					labelLabel: label,
				},
			})
		))
	),
	deleteLabel: async (labelId) => {
		await analysis.updateLabel(labelId)

		await prisma.analysisLabel.updateMany({
			where: { labelId },
			data: {
				labelId: null,
			},
		})
	},
	delete: async (id) => {
		const analysis = await prisma.analysis.findUniqueOrThrow({
			where: { id },
			select: {
				jobs: {
					select: {
						analysisJobId: true,
					},
				},
				labels: {
					select: {
						analysisLabel: {
							select: {
								id: true,
								analysisLabelId: true,
								analysisJobId: true,
							},
						},
					},
				},
			},
		})

		await prisma.jobsOnAnalysis.deleteMany({
			where: {
				analysisId: id,
			},
		})

		await prisma.labelsOnAnalysis.deleteMany({
			where: {
				analysisId: id,
			},
		})

		const analysisLabelsOnJobsId = analysis.labels.map(({ analysisLabel }) => analysisLabel)

		await Promise.all(analysisLabelsOnJobsId.map(async ({ id }) => {
			if (!await prisma.labelsOnAnalysis.count({
				where: {
					analysisLabelId: id,
				},
				take: 1,
			})) {
				await prisma.labelsOnJobs.delete({
					where: { id },
				})
			}
		}))

		const analysisLabelId = unique(analysisLabelsOnJobsId.map(({ analysisLabelId }) => analysisLabelId).sort())

		const labels = (await prisma.analysisLabel.findMany({
			where: {
				id: {
					in: analysisLabelId,
				},
			},
			select: {
				id: true,
				colorId: true,
			},
		})).reduce((labels, { id, colorId }) => ({
			...labels,
			[id]: colorId,
		}), {})

		const colors = Object.values(labels).reduce((colors, colorId) => ({
			...colors,
			[colorId]: false,
		}), {})

		await Promise.all(analysisLabelId.map(async (id) => {
			if (!await prisma.labelsOnJobs.count({
				where: {
					analysisLabelId: id,
				},
				take: 1,
			})) {
				await prisma.analysisLabel.delete({
					where: { id },
				})

				colors[labels[id]] = true
			}
		}))

		const analysisColorId = Object.entries(colors)
			.map(([ colorId, deleted ]) => ({
				colorId,
				deleted,
			}))
			.filter(({ deleted }) => deleted)
			.map(({ colorId }) => Number(colorId))

		await Promise.all(analysisColorId.map(async (id) => {
			if (!await prisma.analysisLabel.count({
				where: {
					colorId: id,
				},
				take: 1,
			})) {
				await prisma.analysisColor.delete({
					where: { id },
				})
			}
		}))

		const analysisJobId = unique([
			...analysis.jobs.map(({ analysisJobId }) => analysisJobId),
			...analysisLabelsOnJobsId.map(({ analysisJobId }) => analysisJobId),
		].sort())

		await Promise.all(analysisJobId.map(async (id) => {
			if (!await prisma.jobsOnAnalysis.count({
				where: {
					analysisJobId: id,
				},
				take: 1,
			}) && !await prisma.labelsOnJobs.count({
				where: {
					analysisJobId: id,
				},
				take: 1,
			})) {
				await prisma.analysisJob.delete({
					where: { id },
				})
			}
		}))

		return await prisma.analysis.delete({
			where: { id },
			select: analysisSelect,
		})
	},
}
