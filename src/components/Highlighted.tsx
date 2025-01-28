import { list } from '/src/Content'

import { newKeywords, newRegex } from '/src/Keyword'

function intervals(regex, content) {
	const answer = []
	const length = content.length
	let start = content.search(regex)

	if (start >= 0) {
		let end = start + Math.max(1, RegExp.lastMatch.length)
		answer.push({
			'start': start,
			'end': end,
		})

		let offset = content.slice(end).search(regex)
		while ((offset >= 0) && (end < length)) {
			start = end + offset
			end = start + Math.max(1, RegExp.lastMatch.length)
			answer.push({
				'start': start,
				'end': end,
			})

			offset = content.slice(end).search(regex)
		}
	}

	return answer
}

function union(set, intervals, colorId) {
	intervals.forEach((interval) => {
		for (let i = interval.start; i < interval.end; ++i) {
			if (!set[i] || colorId < set[i]) {
				set[i] = colorId
			}
		}
	})
}

function partitions(highlights, searchHighlight, index, content) {
	const answer = []
	const push = (key, content, previous) => answer.push(
		previous ?
			<span key={key} className={`highlighted color-${previous} lines`}>
				{content}
			</span>
		:
			<span key={key} className='lines'>
				{content}
			</span>
	)

	const set = Array.from(content).map(() => 0)

	if (set.length > 0) {
		const checkedHighlights = highlights.filter((highlight) => highlight.checked)

		if (checkedHighlights.length > 0) {
			checkedHighlights.forEach((highlight) => union(set, highlight.intervals, highlight.colorId))
		} else {
			highlights.forEach((highlight) => union(set, highlight.intervals, highlight.colorId))
		}

		if (searchHighlight) {
			const keywordsList = newKeywords(searchHighlight)

			if (keywordsList.length > 0) {
				union(set, intervals(newRegex(keywordsList), content), -index)
			}
		}

		let key = 0
		let start = 0
		let end = 1
		let previous = set[0]

		for (let i = 1; i < set.length; ++i) {
			const highlighted = set[i]

			if (highlighted === previous) {
				++end
			} else {
				push(key, content.slice(start, end), previous)

				++key
				start = i
				end = i + 1
				previous = highlighted
			}
		}

		push(key, content.slice(start, end), previous)
	}

	return answer
}

function Highlighted(props) {
	const index = props.index
	const content = props.content || ''

	const searchColor = props.searchColor || 'ff0000'
	const searchHighlight = props.searchHighlight || ''

	const checkedHighlights = props.checkedHighlights

	const highlights = list(props.highlights, (key, highlight) => ({
		key: key,
		colorId: highlight.colorId,
		label: highlight.label,
		intervals: intervals(highlight.regex, content),
		checked: checkedHighlights[key],
	})).filter((highlight) => highlight.intervals.length > 0)


	function checkHighlight(key, checked) {
		checkedHighlights[key] = checked
		props.setCheckedHighlights([...checkedHighlights])
	}

	const labels = highlights.map((highlight) => (
		<span key={highlight.key}>
			<input
				id={`section-${index}-${highlight.key}`}
				type='checkbox'
				defaultChecked={highlight.checked}
				onChange={(e) => checkHighlight(highlight.key, e.target.checked)}
			/>
			<label
				className={highlight.checked ? `highlighted color-${highlight.colorId}` : ''}
				htmlFor={`section-${index}-${highlight.key}`}
			>
				{highlight.label}
			</label>
		</span>
	))

	return (
		<>
			<style>
				{`.highlighted.color-${-index} { color: #${searchColor} }`}
			</style>
			{partitions(highlights, searchHighlight, index, content)}
			{labels.length > 0 ? (
				<>
					<br/>
					<br/>
					<div className='keyword-italic'>
						{labels}
					</div>
				</>
			) : (
				[]
			)}
		</>
	)
}

export default Highlighted
