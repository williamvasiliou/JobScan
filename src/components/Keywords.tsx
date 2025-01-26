import { addKeyword, saveKeyword, deleteKeyword, cancelEdit, byLabel } from '/src/Keyword'

import KeywordAdd from '/src/forms/KeywordAdd'
import KeywordEdit from '/src/forms/KeywordEdit'

function Keywords(props) {
	const highlights = props.highlights

	function updateHighlights({ id, label }, update) {
		let low = 0
		let high = highlights.length - 1

		while (high >= low) {
			if (high === low) {
				const highlight = highlights[low]

				if (highlight.id === id) {
					highlights[low] = update(highlight)

					props.setHighlights([...highlights].sort(byLabel))
				}

				break
			} else {
				const index = (low >> 1) + (high >> 1)
				const highlight = highlights[index]

				if (highlight.id === id) {
					highlights[index] = update(highlight)

					props.setHighlights([...highlights].sort(byLabel))

					break
				} else if (highlight.label > label) {
					high = index - 1
				} else {
					low = index + 1
				}
			}
		}
	}

	function setHighlightProp(prop, value) {
		return (highlight) => ({
			...highlight,
			[prop]: value,
		})
	}

	async function addHighlight(label, keywords) {
		props.setHighlights(await addKeyword(highlights, label, keywords))
	}

	async function saveHighlight(highlight) {
		await saveKeyword(highlight, updateHighlights)
	}

	async function deleteHighlight({ id }) {
		props.setHighlights(await deleteKeyword(highlights, id))
	}

	const keywords = highlights?.map((highlight) => (
		<tr key={highlight.id}>
			{highlight.isEditing ? (
				<KeywordEdit
					onClickCancel={() => updateHighlights(highlight, cancelEdit)}
					onClickSave={() => saveHighlight(highlight)}
					label={`highlight-${highlight.key}-label`}
					newLabel={highlight.newLabel}
					onChangeLabel={(e) => updateHighlights(highlight, setHighlightProp('newLabel', e.target.value))}
					keywords={`highlight-${highlight.key}-keywords`}
					newKeywords={highlight.newKeywords}
					onChangeKeywords={(e) => updateHighlights(highlight, setHighlightProp('newKeywords', e.target.value))}
				/>
			) : (
				<>
					<td><button onClick={() => deleteHighlight(highlight)}>Delete</button></td>
					<td><button onClick={() => updateHighlights(highlight, setHighlightProp('isEditing', true))}>Edit</button></td>
					<td>{highlight.label}</td>
					<td>{highlight.keywords}</td>
				</>
			)}
		</tr>
	))

	return (
		<>
			<KeywordAdd
				onSubmit={addHighlight}
			/>
			{keywords.length > 0 ? (
				<>
					<br/>
					<br/>
					<table>
						<tbody>
							{keywords}
						</tbody>
					</table>
				</>
			) : (
				[]
			)}
		</>
	)
}

export default Keywords
