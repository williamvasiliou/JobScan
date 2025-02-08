import { newTitle, nonEmpty } from './Content'

import { fetchCreate, fetchUpdate, fetchDelete } from './Fetch'

export const byLabel = (previous, next) => previous.label > next.label

export const unique = (keywords) => {
	const items = []

	if (keywords.length > 0) {
		let previous = keywords[0]
		items.push(previous)

		for (let i = 1; i < keywords.length; ++i) {
			const keyword = keywords[i]

			if (keyword !== previous) {
				items.push(keyword)
			}

			previous = keyword
		}
	}

	return items
}

export const newKeywords = (keywords) => unique(keywords.trim().replaceAll('\n', ' ').split(',').map(newTitle).filter(nonEmpty).sort())

export const content = (newKeyword) => /^[ a-zA-Z0-9]$/.test(newKeyword) ? newKeyword : `\\${newKeyword}`
export const set = (newKeyword) => /^[a-zA-Z]$/.test(newKeyword)

export const fix = (keyword) => Array.from(keyword).reduce((keywords, newKeyword) => keywords['\\'] ? ({
	regex: [
		...keywords.regex,
		{
			content: content(newKeyword),
			set: set(newKeyword),
		},
	],
	['\\']: false,
}) : ({
	regex: newKeyword === '\\' ? keywords.regex : [
		...keywords.regex,
		{
			content: content(newKeyword),
			set: false,
		},
	],
	['\\']: newKeyword === '\\',
}), {
	regex: [],
	['\\']: false,
}).regex.reduce((keywords, newKeyword) => keywords.regex.length ? ({
	regex: [
		...keywords.regex,
		keywords.set ? (
			newKeyword.set ? (
				newKeyword.content
			) : (
				`(?i:${newKeyword.content}`
			)
		) : (
			newKeyword.set ? (
				`)${newKeyword.content}`
			) : (
				newKeyword.content
			)
		),
	],
	set: newKeyword.set,
}) : ({
	regex: [
		...keywords.regex,
		newKeyword.set ? (
			newKeyword.content
		) : (
			`(?i:${newKeyword.content}`
		),
	],
	set: newKeyword.set,
}), {
	regex: [],
	set: true,
})

export const fixed = ({ regex, set }) => `${regex.join('')}${set ? '' : ')'}`.replaceAll(' ', '[ ]+')

export const regex = (keyword) => `\\b${fixed(fix(keyword))}\\b`

export const newRegex = (keywords) => RegExp(keywords.map(regex).join('|'))

export const colorsFromPrisma = (colors, { id, color }) => ({
	...colors,
	[id]: color,
})

export const keywordsFromPrisma = ({ keyword }) => keyword

export const fromPrisma = (colors) => ({ id, label, colorId, keywords }) => {
	const highlightKeywordsList = keywords.map(keywordsFromPrisma).map(keywordsFromPrisma)
	const highlightKeywords = highlightKeywordsList.join(', ')

	const highlightColor = colors[colorId]

	return {
		id,
		colorId,
		isEditing: false,
		isColoring: false,
		isUpdatingColor: false,
		color: highlightColor,
		newColor: highlightColor,
		label,
		newLabel: label,
		keywords: highlightKeywords,
		newKeywords: highlightKeywords,
		regex: newRegex(highlightKeywordsList),
	}
}

const create = ([ label, keywords ]) => {
	const highlightLabel = label.label
	const highlightKeywordsList = keywords.map(keywordsFromPrisma)
	const highlightKeywords = highlightKeywordsList.join(', ')

	const color = label.color.color

	return {
		id: label.id,
		colorId: label.colorId,
		isEditing: false,
		isColoring: false,
		isUpdatingColor: false,
		color,
		newColor: color,
		label: highlightLabel,
		newLabel: highlightLabel,
		keywords: highlightKeywords,
		newKeywords: highlightKeywords,
		regex: newRegex(highlightKeywordsList),
	}
}

export const style = (colors) => (
	Object.entries(colors).map(([ colorId, color ]) => (
`.highlighted.color-${colorId} {
	color: #${color};
}

.color-edit.color-${colorId} {
	background-color: #${color};
}`
	)).join('\n')
)

export const addColor = (colorId, color, colors, setColors) => {
	if (!colors[colorId]) {
		setColors({
			...colors,
			[colorId]: color,
		})
	}
}

export const addKeyword = async (label, keywords, color, colors, setColors, highlights, setHighlights) => {
	const highlight = await fetchCreate('/highlights', {
		label,
		keywords,
		color,
	})

	if (highlight) {
		const newHighlight = create(highlight)

		addColor(newHighlight.colorId, newHighlight.color, colors, setColors)

		setHighlights([
			...highlights,
			newHighlight,
		].sort(byLabel))

		return true
	}

	return false
}

export const saveKeyword = async (highlight, updateHighlights) => {
	const { id, newLabel } = highlight

	const newHighlight = await fetchUpdate(`/highlights/${id}`, {
		label: newLabel,
		keywords: highlight.newKeywords,
	})

	if (newHighlight) {
		const [ label, keywords ] = newHighlight

		const highlightKeywordsList = keywords.map(keywordsFromPrisma)
		const highlightKeywords = highlightKeywordsList.join(', ')

		updateHighlights(highlight, () => ({
			...highlight,
			isEditing: false,
			label: label.label,
			newLabel: label.label,
			keywords: highlightKeywords,
			newKeywords: highlightKeywords,
			regex: newRegex(highlightKeywordsList),
		}))

		return true
	}

	return false
}

export const saveColor = async (highlight, updateColor, colors, setColors, updateHighlights) => {
	const { id, colorId, isUpdatingColor, color, newColor } = highlight

	const newHighlight = await fetchUpdate(`/highlights/${id}/colors/${colorId}`, {
		isUpdatingColor,
		color: newColor,
	})

	if (newHighlight) {
		const highlightColorId = newHighlight.id
		const highlightColor = newHighlight.color

		if (isUpdatingColor) {
			updateColor(id, colorId, color, highlightColor)
		} else {
			addColor(highlightColorId, highlightColor, colors, setColors)

			updateHighlights(highlight, () => ({
				...highlight,
				colorId: highlightColorId,
				isColoring: false,
				isUpadingColor: false,
				color: highlightColor,
				newColor: highlightColor,
			}))
		}

		return true
	}

	return false
}

export const deleteKeyword = async (highlights, id, setHighlights) => {
	const highlight = await fetchDelete(`/highlights/${id}`)

	if (highlight) {
		setHighlights(highlights.filter((highlight) => highlight.id !== id))

		return true
	}

	return false
}

export const cancelEdit = (highlight) => ({
	...highlight,
	isEditing: false,
	newLabel: highlight.label,
	newKeywords: highlight.keywords,
})

export const cancelColor = (colors) => (highlight) => ({
	...highlight,
	isColoring: false,
	isUpdatingColor: false,
	newColor: colors[highlight.colorId],
})
