import { VIEWING } from './Action'
import { linked } from './List'

export const trim = (string) => string.trim()
export const nonEmpty = (string) => string.length > 0

export const newFromSplit = (character, trimLike) => (string) => string.trim().split(character).map(trimLike).filter(nonEmpty).join(character)

export const newTitle = newFromSplit(' ', trim)
export const newContent = newFromSplit('\n', newTitle)

export const list = (items, item) => {
	const list = []

	for (let i = 0; i < items.length; ++i) {
		list.push(item(i, items[i]))
	}

	return list
}

export const Section = {
	create: (id, header, content) => ({
		id: id,
		isExpanded: true,
		action: {
			type: VIEWING,
			state: 0,
		},
		header: header,
		newHeader: header,
		content: content,
		newContent: content,
	}),
	hydrate: (section, { header, content }) => {
		section.header = header
		section.newHeader = header
		section.content = content
		section.newContent = content
	},
	fromPrisma: ({ id, header, content }) => Section.create(id, header, content),
	toPrisma: ({ header, content }) => ({
		header: header,
		content: content,
	}),
	newSplitContent: (line, lines) => {
		const content = {
			up: [],
			header: newTitle(lines[line]),
			down: [],
		}

		for (let i = 0; i < line; ++i) {
			content.up.push(lines[i])
		}
		content.up = newContent(content.up.join('\n'))

		for (let i = line + 1; i < lines.length; ++i) {
			content.down.push(lines[i])
		}
		content.down = newContent(content.down.join('\n'))

		return content
	},
	glue: (up, down) => {
		up.action.type = VIEWING
		up.action.state = 0

		up.content = `${up.content}\n${down.header}\n${down.content}`
		up.newContent = up.content

		return up
	},
}

export const newDate = (date) => /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date) ? date : ''

export const newTime = (time) => /^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$/.test(time) ? time : ''

export const dateFromPrisma = (date) => {
	const [ dateString, timeString ] = date.toISOString().split('T')
	const newTimeString = timeString.slice(0, 8)

	return {
		date: dateString,
		newDate: dateString,
		time: newTimeString,
		newTime: newTimeString,
		value: date,
	}
}

export const noDateFromPrisma = () => ({
	date: '',
	newDate: '',
	time: '',
	newTime: '',
	value: null,
})

export const dateTimeFromPrisma = (date) => date ?
	dateFromPrisma(new Date(date)) :
	noDateFromPrisma()

export const fromPrisma = ({ id, title, url, createdAt, updatedAt, published, sections }) => ({
	id: id,
	title: title,
	newTitle: title,
	url: url,
	newUrl: url,
	isEditing: false,
	isDateExpanded: false,
	isDating: false,
	createdAt: new Date(createdAt),
	updatedAt: new Date(updatedAt),
	published: dateTimeFromPrisma(published),
	sections: linked(sections.map(Section.fromPrisma)),
})

export const toPrisma = ({ title, url }) => ({
	title: title,
	url: url,
})
