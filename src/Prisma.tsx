import { PrismaClient } from '@prisma/client'
import { spawn } from 'node:child_process'

import { newTitle, newContent, newDate, newTime } from './Content'
import { unique, newKeywords, newRegex } from './Keyword'
import { TITLE, URL, HEADER, CONTENT, TEXT, CREATED, UPDATED, PUBLISHED, DATE, MAX, noText, noDate } from './Search'

import { jobTake, analysisTake } from './Fetch'

import { createResume } from './Resume'

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

const jobExportSelect = {
	title: true,
	url: true,
	published: true,
	sections: {
		select: {
			header: true,
			content: true,
		},
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
		const [job, previous, next] = await prisma.$transaction([
			prisma.job.findUniqueOrThrow({
				where: { id },
				select: jobSelect,
			}),
			prisma.job.findFirst({
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
			}),
			prisma.job.findFirst({
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
			}),
		])

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
	findLabelsJob: async (id) => await prisma.$transaction(async (tx) => {
		const job = await tx.job.findUniqueOrThrow({
			where: { id },
			select: {
				id: true,
			},
		})

		const sections = await tx.section.findMany({
			where: {
				jobId: job.id,
			},
			select: {
				content: true,
			},
		})

		const labels = await tx.label.findMany({
			select: {
				label: true,
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

		const contents = sections.map(({ content }) => content).join('\n')

		return labels.filter(({ keywords }) => (
			newRegex(keywords.map(({ keyword }) => (
				keyword.keyword
			))).test(contents)
		)).map(({ label }) => label)
	}),
	findLabelsAnalysis: async (id, jobId) => await prisma.$transaction(async (tx) => {
		const analysis = await tx.analysis.findUniqueOrThrow({
			where: { id },
			select: {
				labels: {
					select: {
						analysisLabel: {
							select: jobId > 0 ? {
								analysisJobId: true,
								analysisLabelId: true,
							} : {
								analysisLabelId: true,
							},
						},
					},
				},
			},
		})

		const analysisLabel = analysis.labels.map(({ analysisLabel }) => analysisLabel)
		const rank = analysisLabel.reduce((rank, { analysisLabelId }) => ({
			...rank,
			[analysisLabelId]: (rank[analysisLabelId] ?? 0) + 1,
		}), {})

		const analysisLabelId = unique((jobId > 0 ? (
			analysisLabel.filter(({ analysisJobId }) => analysisJobId === jobId)
		) : (
			analysisLabel
		)).map(({ analysisLabelId }) => analysisLabelId).sort())

		const analysisLabels = {
			...((await tx.analysisLabel.findMany({
				where: {
					id: {
						in: analysisLabelId,
					},
					labelId: null,
				},
				select: {
					id: true,
					labelLabel: true,
				},
			})).reduce((labels, { id, labelLabel }) => ({
				...labels,
				[id]: labelLabel,
			}), {})),
			...((await tx.analysisLabel.findMany({
				where: {
					id: {
						in: analysisLabelId,
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
				},
			})).reduce((labels, { id, label, labelLabel }) => ({
				...labels,
				[id]: labelLabel ?? label.label,
			}), {})),
		}

		return analysisLabelId.sort((previous, next) =>
			-(analysisLabels[previous] < analysisLabels[next])
		).sort((previous, next) =>
			-(rank[previous] > rank[next])
		).map((id) => analysisLabels[id])
	}),
	findLabels: async (analysis, id, jobId) => {
		if (!isFinite(id) || !isFinite(jobId)) {
			return false
		}

		if (analysis) {
			return await job.findLabelsAnalysis(id, jobId)
		} else {
			return await job.findLabelsJob(id)
		}
	},
	export: async (id) => ({
		search: false,
		jobs: [await prisma.job.findUniqueOrThrow({
			where: { id },
			select: jobExportSelect,
		})],
	}),
	exportWhere: async (where, search) => (where ? ({
		search,
		jobs: await prisma.job.findMany({
			where,
			select: jobExportSelect,
		})
	}) : ({
		search,
		jobs: await prisma.job.findMany({
			select: jobExportSelect,
		})
	})),
	exportSimple: async (search) => await job.exportWhere(jobSearchSimpleWhere(search), {
		search,
		filter: 0,
		start: '',
		end: '',
	}),
	exportAdvanced: async (search, start, end, bits) => {
		const hasNoText = noText(bits)
		const hasNoDate = noDate(bits)
		const filter = {
			search,
			filter: bits,
			start,
			end,
		}

		if (hasNoText && hasNoDate) {
			return await job.exportWhere(false, filter)
		} else if (hasNoText) {
			const where = jobSearchDateWhere(start, end, bits)

			return await job.exportWhere(where, filter)
		} else if (hasNoDate) {
			const where = jobSearchTextWhere(search, bits)

			return await job.exportWhere(where, filter)
		} else {
			const whereDate = jobSearchDateWhere(start, end, bits)
			const whereText = jobSearchTextWhere(search, bits)

			if (whereDate && whereText) {
				const where = {
					...whereDate,
					...whereText,
				}

				return await job.exportWhere(where, filter)
			} else if (whereDate) {
				return await job.exportWhere(whereDate, filter)
			} else if (whereText) {
				return await job.exportWhere(whereText, filter)
			} else {
				return await job.exportWhere(false, filter)
			}
		}
	},
	exportMany: async (search, start, end, filter) => {
		if (!isFinite(filter) || filter <= 0) {
			return await job.exportSimple(search.trim())
		} else {
			return await job.exportAdvanced(search.trim(), start.trim(), end.trim(), filter & MAX)
		}
	},
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
	import: async (jobs) => {
		if (!(jobs instanceof Object) || Array.isArray(jobs) || !('jobs' in jobs) || !Array.isArray(jobs.jobs)) {
			return false
		}

		const newJobs = jobs.jobs.filter((job) => (
			(job instanceof Object) &&
			!Array.isArray(job) &&
			(Object.keys(job).length === 4) &&
			('title' in job) &&
			(typeof job.title === 'string') &&
			('url' in job) &&
			(typeof job.url === 'string') &&
			('published' in job) &&
			(job.published === null || (
				typeof job.published === 'string' &&
				isFinite(Date.parse(job.published))
			)) &&
			('sections' in job) &&
			Array.isArray(job.sections) &&
			(job.sections.length > 0) &&
			job.sections.every((section) => (
				(section instanceof Object) &&
				!Array.isArray(section) &&
				(Object.keys(section).length === 2) &&
				('header' in section) &&
				(typeof section.header === 'string') &&
				('content' in section) &&
				(typeof section.content === 'string')
			))
		)).map(({ title, url, published, sections }) => ({
			title: newTitle(title),
			url: url.trim(),
			published: published ? new Date(published) : null,
			sections: {
				create: sections.map(({ header, content }) => ({
					header: newTitle(header),
					content: newContent(content),
				})),
			},
		})).filter(({ title, sections }) => (
			title && sections.create.every(({ header, content }) => (
				header && content
			))
		))

		if (newJobs.length > 0) {
			await prisma.$transaction(newJobs.map((data) => (
				prisma.job.create({
					data,
				})
			)))

			return {
				count: newJobs.length,
			}
		}

		return false
	},
	update: async (id, title, url) => {
		if (!isFinite(id) || typeof(title) !== 'string' || typeof(url) !== 'string') {
			return false
		}

		const jobTitle = newTitle(title)
		const jobUrl = url.trim()

		if (jobTitle) {
			return await prisma.$transaction(async (tx) => {
				await analysis.updateJob(tx, id)

				return await tx.job.update({
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
			})
		}

		return false
	},
	updatePublished: async (id, date, time) => {
		if (!isFinite(id) || typeof(date) !== 'string' || typeof(time) !== 'string') {
			return false
		}

		const dateTrim = date.trim()
		const timeTrim = time.trim()

		if (!dateTrim && !timeTrim) {
			return await prisma.$transaction(async (tx) => {
				await analysis.updateJob(tx, id)

				return await tx.job.update({
					where: { id },
					data: {
						published: null,
					},
					select: {
						updatedAt: true,
						published: true,
					},
				})
			})
		} else {
			const jobDate = newDate(dateTrim)
			const jobTime = newTime(timeTrim)

			if (jobDate && jobTime) {
				return await prisma.$transaction(async (tx) => {
					await analysis.updateJob(tx, id)

					return await tx.job.update({
						where: { id },
						data: {
							published: jobNewDate(jobDate, jobTime),
						},
						select: {
							updatedAt: true,
							published: true,
						},
					})
				})
			}
		}

		return false
	},
	updateUpdatedAt: async (tx, id) => {
		await analysis.updateJob(tx, id)

		await tx.job.update({
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
		if (!isFinite(jobId) || typeof(header) !== 'string' || typeof(content) !== 'string') {
			return false
		}

		const sectionHeader = newTitle(header)
		const sectionContent = newContent(content)

		if (sectionHeader && sectionContent) {
			return await prisma.$transaction(async (tx) => {
				const section = await tx.section.create({
					data: {
						jobId,
						header: sectionHeader,
						content: sectionContent,
					},
					select: sectionSelect,
				})

				if (section) {
					await job.updateUpdatedAt(tx, jobId)
				} else {
					return false
				}

				return section
			})
		}

		return false
	},
	update: async (id, header, content) => {
		if (!isFinite(id) || typeof(header) !== 'string' || typeof(content) !== 'string') {
			return false
		}

		return await prisma.$transaction(async (tx) => {
			const { jobId } = await tx.section.findUniqueOrThrow({
				where: { id },
				select: {
					jobId: true,
				},
			})

			const sectionHeader = newTitle(header)
			const sectionContent = newContent(content)

			if (sectionHeader && sectionContent) {
				const section = await tx.section.update({
					where: { id },
					data: {
						header: sectionHeader,
						content: sectionContent,
					},
					select: sectionSelect,
				})

				if (section) {
					await job.updateUpdatedAt(tx, jobId)
				} else {
					return false
				}

				return section
			}

			return false
		})
	},
	swap: async (id, newId) => {
		if (!isFinite(id) || !isFinite(newId) || id === newId) {
			return false
		}

		return await prisma.$transaction(async (tx) => {
			const section = await tx.section.findUniqueOrThrow({
				where: { id },
				select: {
					header: true,
					content: true,
					jobId: true,
				},
			})

			const newSection = await tx.section.findUniqueOrThrow({
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
					await tx.section.update({
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
					await tx.section.update({
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
					await job.updateUpdatedAt(tx, section.jobId)
				} else {
					return false
				}

				return sections
			}

			return false
		})
	},
	delete: async (id) => {
		if (!isFinite(id)) {
			return false
		}

		return await prisma.$transaction(async (tx) => {
			const { jobId } = await tx.section.findUniqueOrThrow({
				where: { id },
				select: {
					jobId: true,
				},
			})

			const count = await tx.section.count({
				where: { jobId },
				take: 2,
			})

			if (count > 1) {
				const section = await tx.section.delete({
					where: { id },
					select: sectionSelect,
				})

				if (section) {
					await job.updateUpdatedAt(tx, jobId)
				} else {
					return false
				}

				return section
			}

			return false
		})
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
	create: async (tx, color) => {
		if (typeof(color) !== 'string') {
			return false
		}

		const css = newColor(color)

		if (css) {
			return await tx.color.upsert({
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
	update: async (tx, id, color) => {
		if (!isFinite(id) || typeof(color) !== 'string') {
			return false
		}

		const css = newColor(color)

		if (css) {
			await analysis.updateColor(tx, id)

			const labels = await tx.label.findMany({
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

			await analysis.updateManyLabel(tx, labels)

			return await tx.color.update({
				where: { id },
				data: {
					color: css,
				},
			})
		}

		return false
	},
	delete: async (tx, id) => {
		if (!isFinite(id)) {
			return false
		}

		if (!await tx.label.count({
			where: {
				colorId: id,
			},
			take: 1,
		})) {
			await analysis.deleteColor(tx, id)

			return await tx.color.delete({
				where: { id },
			})
		}

		return false
	},
}

const prismaLabel = {
	create: async (tx, label, colorId) => await tx.label.create({
		data: {
			label,
			colorId,
		},
	}),
	update: async (tx, id, label) => {
		await analysis.updateLabel(tx, id)

		return await tx.label.update({
			where: { id },
			data: { label },
		})
	},
	updateColor: async (tx, id, colorId) => {
		await analysis.updateLabel(tx, id)

		return await tx.label.update({
			where: { id },
			data: { colorId },
			select: {
				colorId: true,
			},
		})
	},
	delete: async (tx, id) => {
		await analysis.deleteLabel(tx, id)

		const label = await tx.label.delete({
			where: { id },
		})

		await prismaColor.delete(tx, label.colorId)

		return label
	},
}

const keyword = {
	upsert: async (tx, keywords) => (
		await Promise.all(keywords.map(async (keyword) => (
			await tx.keyword.upsert({
				where: { keyword },
				update: {
				},
				create: { keyword },
			})
		)))
	),
	delete: async (tx, id) => await tx.keyword.delete({
		where: { id },
	}),
}

const keywordsOnLabels = {
	createMany: async (tx, labelId, keywords) => (
		await tx.keywordsOnLabels.createMany({
			data: keywords.map((keyword) => ({
				labelId,
				keywordId: keyword.id,
			})),
		})
	),
	deleteMany: async (tx, labelId, keep) => {
		const keywords = await tx.keywordsOnLabels.findMany({
			where: { labelId },
			select: {
				keywordId: true,
			},
		})

		await tx.keywordsOnLabels.deleteMany({
			where: { labelId },
		})

		const keepId = keep.map(({ id }) => id)

		const deletedKeywords = keywords.filter((id) => (
			keepId.indexOf(id.keywordId) === -1
		))

		await Promise.all(deletedKeywords.map(async (id) => {
			const { keywordId } = id

			if (!await tx.keywordsOnLabels.count({
				where: { keywordId },
				take: 1,
			})) {
				await keyword.delete(tx, keywordId)
			}
		}))

		return keywords
	},
}

async function uniqueKeywords(tx, labelId, keywords) {
	const { length } = keywords

	if (length > 0) {
		const subsets = await tx.keywordsOnLabels.groupBy({
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

		const sets = await tx.keywordsOnLabels.groupBy({
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

		return await prisma.$transaction(async (tx) => {
			const highlightUnique = await uniqueKeywords(tx, 0, highlightKeywords)

			if (highlightLabel && highlightUnique) {
				const newColor = await prismaColor.create(tx, color)
				const newLabel = await prismaLabel.create(tx, highlightLabel, newColor.id)

				if (newLabel) {
					const newKeywords = await keyword.upsert(tx, highlightKeywords)

					if (newKeywords) {
						await keywordsOnLabels.createMany(tx, newLabel.id, newKeywords)

						newLabel.color = newColor
						return [newLabel, newKeywords]
					}
				}
			}

			return false
		})
	},
	update: async (labelId, label, keywords) => {
		if (!isFinite(labelId) || typeof(label) !== 'string' || typeof(keywords) !== 'string') {
			return false
		}

		const highlightLabel = newTitle(label)
		const highlightKeywords = newKeywords(keywords)

		return await prisma.$transaction(async (tx) => {
			const highlightUnique = await uniqueKeywords(tx, labelId, highlightKeywords)

			if (highlightLabel && highlightUnique) {
				const newLabel = await prismaLabel.update(tx, labelId, highlightLabel)

				if (newLabel) {
					const newKeywords = await keyword.upsert(tx, highlightKeywords)

					await keywordsOnLabels.deleteMany(tx, labelId, newKeywords)
					await keywordsOnLabels.createMany(tx, labelId, newKeywords)

					return [newLabel, newKeywords]
				}
			}

			return false
		})
	},
	updateColor: async (labelId, colorId, isUpdatingColor, color) => {
		if (typeof(isUpdatingColor) !== 'boolean') {
			return false
		}

		return await prisma.$transaction(async (tx) => {
			if (isUpdatingColor) {
				const newColor = await tx.color.findUnique({
					where: { color },
				})

				if (newColor) {
					const id = newColor.id

					if (id === colorId) {
						return newColor
					} else {
						await tx.label.updateMany({
							where: {
								colorId: id,
							},
							data: { colorId },
						})

						await analysis.deleteColor(tx, id)

						await tx.color.delete({
							where: { id },
						})

						return await prismaColor.update(tx, colorId, color)
					}
				} else {
					return await prismaColor.update(tx, colorId, color)
				}
			} else {
				const newColor = await prismaColor.create(tx, color)
				const id = newColor.id

				if (id !== colorId) {
					await prismaLabel.updateColor(tx, labelId, id)
					await prismaColor.delete(tx, colorId)
				}

				return newColor
			}
		})
	},
	delete: async (labelId) => {
		if (!isFinite(labelId)) {
			return false
		}

		return await prisma.$transaction(async (tx) => {
			if (await keywordsOnLabels.deleteMany(tx, labelId, [])) {
				return await prismaLabel.delete(tx, labelId)
			}

			return false
		})
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

const analysisCreateDateCreated = async (tx, orderBy) => {
	const { createdAt } = await tx.job.findFirst({
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

const analysisCreateDateItem = async (tx, where, item, orderBy) => {
	const job = where ? (await tx.job.findFirst({
		where,
		select: {
			[item]: true,
		},
		orderBy: {
			[item]: orderBy,
		},
	})) : (await tx.job.findFirst({
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

const analysisCreateDatePublished = async (tx, where, orderBy) => {
	if (!where || !where.published) {
		return await analysisCreateDateCreated(tx, orderBy)
	}

	const job = await tx.job.findFirst({
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

	return await analysisCreateDateItem(tx, where, 'createdAt', orderBy)
}

const analysisCreateDate = async (tx, dateTime, where, item, isPublished, orderBy) => {
	if (dateTime) {
		const { date, time } = dateTime

		return {
			isPublished,
			date: jobNewDate(date, time),
		}
	} else if (isPublished) {
		return await analysisCreateDatePublished(tx, where, orderBy)
	} else {
		return await analysisCreateDateItem(tx, where, item, orderBy)
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

const analysisCreateLabelsOnJobs = async (tx, analysisId, jobsId) => {
	const sections = await tx.section.findMany({
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

	const labels = await tx.label.findMany({
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

	const colorId = await tx.label.findMany({
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

	const analysisColors = await tx.analysisColor.findMany({
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

	const newAnalysisColors = await tx.analysisColor.createManyAndReturn({
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

	const analysisLabels = await tx.analysisLabel.findMany({
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

	const newAnalysisLabels = await tx.analysisLabel.createManyAndReturn({
		data: newLabelsId.map((labelId) => ({
			labelId,
			colorId: labelColors[labelId],
		})),
		select: {
			id: true,
			labelId: true,
		},
	})

	const analysisJobs = await tx.analysisJob.findMany({
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

	const newAnalysisJobs = await tx.analysisJob.createManyAndReturn({
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

	const analysisLabelsOnJobs = await tx.labelsOnJobs.findMany({
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

	const newLabelsOnAnalysis = await tx.labelsOnJobs.createManyAndReturn({
		data: newAnalysisLabelsOnJobs,
		select: {
			id: true,
		},
	})

	await tx.labelsOnAnalysis.createMany({
		data: [
			...analysisLabelsOnJobs,
			...newLabelsOnAnalysis,
		].map(({ id }) => ({
			analysisId,
			analysisLabelId: id,
		})),
	})

	await tx.jobsOnAnalysis.createMany({
		data: labelsOnJobs.filter(({ labels }) => !labels.length).map(({ jobId }) => ({
			analysisId,
			analysisJobId: jobs.jobs[jobId],
		})),
	})
}

const analysisCreate = async (tx, jobs, search, filter, start, end) => {
	const analysis = await tx.analysis.create({
		data: {
			title: 'Untitled Analysis',
			search,
			filter,
			start,
			end,
		},
		select: analysisSelect,
	})

	await analysisCreateLabelsOnJobs(tx, analysis.id, jobs.map(({ id }) => id))

	return analysis
}

const analysisCreateFromJobs = async (tx, jobs, where, { search, filter, start, end }) => {
	if (jobs.length > 0) {
		const date = filter & DATE

		const item = jobDateItem[date] || 'createdAt'
		const isPublished = date === PUBLISHED

		const startDate = await analysisCreateDate(tx, newDateTime(start), where, item, isPublished, 'asc')
		const endDate = await analysisCreateDate(tx, newDateTime(end), where, item, isPublished, 'desc')

		const isDatePublished = startDate.isPublished && endDate.isPublished

		if (isPublished && !isDatePublished) {
			return await analysisCreate(tx, jobs, search, filter & TEXT, startDate.date, endDate.date)
		} else {
			return await analysisCreate(tx, jobs, search, filter, startDate.date, endDate.date)
		}
	}

	return false
}

const analysisCreateWhere = async (tx, where, analysis) => (where ? (
	await analysisCreateFromJobs(tx, await tx.job.findMany({
		where,
		select: analysisJobSelect,
	}), where, analysis)
) : (
	await analysisCreateFromJobs(tx, await tx.job.findMany({
		select: analysisJobSelect,
	}), where, analysis)
))

const analysisCreateSimple = async (tx, search) => await analysisCreateWhere(tx, jobSearchSimpleWhere(search), {
	search,
	filter: 0,
	start: '',
	end: '',
})

const analysisCreateAdvanced = async (tx, search, start, end, bits) => {
	const hasNoText = noText(bits)
	const hasNoDate = noDate(bits)
	const analysis = {
		search,
		filter: bits,
		start,
		end,
	}

	if (hasNoText && hasNoDate) {
		return await analysisCreateWhere(tx, false, analysis)
	} else if (hasNoText) {
		const where = jobSearchDateWhere(start, end, bits)

		return await analysisCreateWhere(tx, where, analysis)
	} else if (hasNoDate) {
		const where = jobSearchTextWhere(search, bits)

		return await analysisCreateWhere(tx, where, analysis)
	} else {
		const whereDate = jobSearchDateWhere(start, end, bits)
		const whereText = jobSearchTextWhere(search, bits)

		if (whereDate && whereText) {
			const where = {
				...whereDate,
				...whereText,
			}

			return await analysisCreateWhere(tx, where, analysis)
		} else if (whereDate) {
			return await analysisCreateWhere(tx, whereDate, analysis)
		} else if (whereText) {
			return await analysisCreateWhere(tx, whereText, analysis)
		} else {
			return await analysisCreateWhere(tx, false, analysis)
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

const analysisFindManyLabel = async (tx, id) => ({
	...((await tx.analysisLabel.findMany({
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
	...((await tx.analysisLabel.findMany({
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

const analysisFindManyColor = async (tx, id) => ({
	...((await tx.analysisColor.findMany({
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
	...((await tx.analysisColor.findMany({
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

const analysisFindManyJob = async (tx, id) => ({
	...((await tx.analysisJob.findMany({
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
	...((await tx.analysisJob.findMany({
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
	findUnique: async (id) => await prisma.$transaction(async (tx) => {
		const analysis = await tx.analysis.findUniqueOrThrow({
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
		const analysisLabels = await analysisFindManyLabel(tx, analysisLabelId)

		const analysisColorId = unique(Object.values(analysisLabels).map(({ colorId }) => colorId).sort())

		const analysisJobId = unique([
			...analysis.jobs.map(({ analysisJobId }) => analysisJobId),
			...analysisLabelsOnJobsId.map(({ analysisJobId }) => analysisJobId),
		].sort())

		const previous = await tx.analysis.findFirst({
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

		const next = await tx.analysis.findFirst({
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
				colors: await analysisFindManyColor(tx, analysisColorId),
				labels: analysisLabels,
				jobs: await analysisFindManyJob(tx, analysisJobId),
			},
			previous,
			next,
		}
	}),
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

		return await prisma.$transaction(async (tx) => {
			if (!isFinite(filter) || filter <= 0) {
				return await analysisCreateSimple(tx, search.trim())
			} else {
				return await analysisCreateAdvanced(tx, search.trim(), start.trim(), end.trim(), filter & MAX)
			}
		})
	},
	update: async (id, title) => {
		if (!isFinite(id) || typeof(title) !== 'string') {
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
	updateJob: async (tx, jobId) => {
		const {
			title,
			url,
			createdAt,
			updatedAt,
			published,
		} = await tx.job.findUniqueOrThrow({
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

		await tx.analysisJob.updateMany({
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
	updateColor: async (tx, colorId) => {
		const { color } = await tx.color.findUniqueOrThrow({
			where: {
				id: colorId,
			},
			select: {
				color: true,
			},
		})

		await tx.analysisColor.updateMany({
			where: {
				colorId,
				colorColor: null,
			},
			data: {
				colorColor: color,
			},
		})
	},
	deleteColor: async (tx, colorId) => {
		await analysis.updateColor(tx, colorId)

		await tx.analysisColor.updateMany({
			where: { colorId },
			data: {
				colorId: null,
			},
		})
	},
	updateLabel: async (tx, labelId) => {
		const { label } = await tx.label.findUniqueOrThrow({
			where: {
				id: labelId,
			},
			select: {
				label: true,
			},
		})

		await tx.analysisLabel.updateMany({
			where: {
				labelId,
				labelLabel: null,
			},
			data: {
				labelLabel: label,
			},
		})
	},
	updateManyLabel: async (tx, labels) => await Promise.all(
		labels.map(async ({ id, label }) => (
			await tx.analysisLabel.updateMany({
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
	deleteLabel: async (tx, labelId) => {
		await analysis.updateLabel(tx, labelId)

		await tx.analysisLabel.updateMany({
			where: { labelId },
			data: {
				labelId: null,
			},
		})
	},
	delete: async (id) => await prisma.$transaction(async (tx) => {
		const analysis = await tx.analysis.findUniqueOrThrow({
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

		await tx.jobsOnAnalysis.deleteMany({
			where: {
				analysisId: id,
			},
		})

		await tx.labelsOnAnalysis.deleteMany({
			where: {
				analysisId: id,
			},
		})

		const analysisLabelsOnJobsId = analysis.labels.map(({ analysisLabel }) => analysisLabel)

		await Promise.all(analysisLabelsOnJobsId.map(async ({ id }) => {
			if (!await tx.labelsOnAnalysis.count({
				where: {
					analysisLabelId: id,
				},
				take: 1,
			})) {
				await tx.labelsOnJobs.delete({
					where: { id },
				})
			}
		}))

		const analysisLabelId = unique(analysisLabelsOnJobsId.map(({ analysisLabelId }) => analysisLabelId).sort())

		const labels = (await tx.analysisLabel.findMany({
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
			if (!await tx.labelsOnJobs.count({
				where: {
					analysisLabelId: id,
				},
				take: 1,
			})) {
				await tx.analysisLabel.delete({
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
			if (!await tx.analysisLabel.count({
				where: {
					colorId: id,
				},
				take: 1,
			})) {
				await tx.analysisColor.delete({
					where: { id },
				})
			}
		}))

		const analysisJobId = unique([
			...analysis.jobs.map(({ analysisJobId }) => analysisJobId),
			...analysisLabelsOnJobsId.map(({ analysisJobId }) => analysisJobId),
		].sort())

		await Promise.all(analysisJobId.map(async (id) => {
			if (!await tx.jobsOnAnalysis.count({
				where: {
					analysisJobId: id,
				},
				take: 1,
			}) && !await tx.labelsOnJobs.count({
				where: {
					analysisJobId: id,
				},
				take: 1,
			})) {
				await tx.analysisJob.delete({
					where: { id },
				})
			}
		}))

		return await tx.analysis.delete({
			where: { id },
			select: analysisSelect,
		})
	}),
}

export const newResume = async (res, analysis, id, jobId) => await createResume(
	spawn,
	res,
	() => analysis ? (jobId > 0 ? `analysis-${id}-${jobId}` : `analysis-${id}`) : id,
	async () => await job.findLabels(analysis, id, jobId),
)
