import { VIEWING } from './Action'
import { create as List, linked, items } from './List'

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
	create: (key, header, content) => ({
		key: key,
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
	fromPrisma: ({ id, header, content }) => Section.create(id, header, content),
	toPrisma: ({ header, content }) => ({
		data: {
			header: header,
			content: content,
		},
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

export const fromPrisma = ({ id, title, url, sections }) => ({
	key: id,
	title: title,
	newTitle: title,
	url: url,
	newUrl: url,
	isEditing: false,
	sections: linked(sections.map(Section.fromPrisma)),
})

export const toPrisma = ({ title, url, sections }) => ({
	data: {
		title: title,
		url: url,
		sections: items(sections).map(Section.toPrisma),
	},
})
