import { newTitle } from './Content'

export const NONE = 0
export const TITLE = 1
export const URL = 2
export const HEADER = 4
export const CONTENT = 8
export const TEXT = 15
export const CREATED = 16
export const UPDATED = 32
export const PUBLISHED = 48
export const DATE = 48
export const MAX = 63

export const checkboxes = Object.entries({
	[TITLE]: {
		id: 'title',
		prop: 'isTitle',
		label: 'Title',
	},
	[URL]: {
		id: 'url',
		prop: 'isUrl',
		label: 'URL',
	},
	[HEADER]: {
		id: 'header',
		prop: 'isHeader',
		label: 'Header',
	},
	[CONTENT]: {
		id: 'content',
		prop: 'isContent',
		label: 'Content',
	},
})

export const dates = {
	[CREATED]: 'Created',
	[UPDATED]: 'Updated',
	[PUBLISHED]: 'Published',
}

export const dateSelect = Object.entries(dates)

export const reset = {
	isAdvanced: false,
	checked: 0,
	date: 0,
	bits: 0,
	search: '',
	start: 0,
	end: 0,
}

export const fromChecked = ({ isContent, isHeader, isUrl, isTitle }) => [isContent, isHeader, isUrl, isTitle]

export const bits = (checked, select) => MAX & (
	fromChecked(checked).reduce((bits, bit) => bits << 1 | bit, 0) |
	select
)

export const fromDateTime = (date, time) => ({
	date: date,
	time: time,
	value: new Date(`${date} ${time}`.trim()),
})

export const newDate = (date) => date ? fromDateTime(date.date.trim(), date.time.trim()) : 0

export const create = (search) => ({
	...search,
	bits: search.isAdvanced ? bits(search.checked, search.checked.isDate ? search.date : 0) : 0,
	search: newTitle(search.search),
	start: newDate(search.start),
	end: newDate(search.end),
})

export const setAdvanced = (search) => ({
	...search,
	isAdvanced: true,
	checked: {
		isTitle: true,
		isUrl: true,
		isHeader: true,
		isContent: true,
		isDate: false,
	},
	date: CREATED,
	start: {
		date: '',
		time: '',
		value: 0,
	},
	end: {
		date: '',
		time: '',
		value: 0,
	},
})

export const setChecked = (search, prop, checked) => ({
	...search,
	checked: {
		...search.checked,
		[prop]: checked,
	},
})

export const setDate = (search, end, type, value) => ({
	...search,
	[end]: {
		...search[end],
		[type]: value,
	},
})

export const removeAdvanced = (search) => ({
	...search,
	isAdvanced: false,
	checked: 0,
	date: 0,
	start: 0,
	end: 0,
})

export const noText = (bits) => !(bits & TEXT)
export const noDate = (bits) => !(bits & DATE)
export const emptyDate = (start, end) => start.date && end.date && end.value < start.value

export const empty = ({ isAdvanced, bits, search, start, end }) => {
	if (isAdvanced) {
		const hasNoText = noText(bits)
		const hasNoDate = noDate(bits)

		if (hasNoText && hasNoDate) {
			return true
		} else if (hasNoText) {
			return emptyDate(start, end)
		} else if (hasNoDate) {
			return !search
		} else {
			return !search && emptyDate(start, end)
		}
	}

	return !search
}

export const queryDateItem = (end, { date, time }) => (date && time ?
	`${end}=${date} ${time}` :
	`${end}=${date}`
)

export const queryDate = (query, start, end) => {
	if (!emptyDate(start, end)) {
		query.push(queryDateItem('start', start))
		query.push(queryDateItem('end', end))
	}
}

export const queryText = (query, search) => {
	if (search) {
		query.push(`q=${escape(search)}`)
	}
}

export const queryFilter = (query, bits) => {
	if (query.length > 0) {
		query.push(`filter=${bits}`)
	}
}

export const query = ({ isAdvanced, bits, search, start, end }) => {
	const query = []

	if (isAdvanced) {
		const hasNoText = noText(bits)
		const hasNoDate = noDate(bits)

		if (hasNoText && hasNoDate) {
			return []
		} else if (hasNoText) {
			queryDate(query, start, end)
			queryFilter(query, bits)
		} else if (hasNoDate) {
			queryText(query, search)
			queryFilter(query, bits)
		} else {
			queryText(query, search)
			queryDate(query, start, end)
			queryFilter(query, bits)
		}
	} else {
		queryText(query, search)
	}

	return query
}

export const changed = (previous, { isAdvanced, bits, search, start, end }) => {
	if (previous.isAdvanced && isAdvanced) {
		return previous.bits !== bits ||
			previous.search !== search ||
			previous.start.date !== start.date ||
			previous.start.time !== start.time ||
			previous.end.date !== end.date ||
			previous.end.time !== end.time
	} else if (previous.isAdvanced) {
		return previous.bits !== TEXT ||
			previous.search !== search
	} else if (isAdvanced) {
		return bits !== TEXT ||
			previous.search !== search
	} else {
		return previous.search !== search
	}
}
