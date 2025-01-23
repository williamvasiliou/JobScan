import { addKeyword, cancelEdit, saveEdit, byLabel } from '/src/Keyword'

import KeywordAdd from '/src/forms/KeywordAdd'
import KeywordEdit from '/src/forms/KeywordEdit'

function Keywords(props) {
	const highlights = props.highlights

	function deleteHighlight(key) {
		props.setHighlights(highlights.filter((highlight) => highlight.key !== key))
	}

	function updateHighlights(key, update) {
		props.setHighlights(highlights.map((highlight) => {
			if (highlight.key === key) {
				update(highlight)
			}

			return highlight
		}).sort(byLabel))
	}

	function setHighlightProp(prop, value) {
		return (highlight) => {
			highlight[prop] = value
		}
	}

	const keywords = highlights?.map((highlight) => (
		<tr key={highlight.key}>
			{highlight.isEditing ? (
				<KeywordEdit
					onClickCancel={() => updateHighlights(highlight.key, cancelEdit)}
					onClickSave={() => updateHighlights(highlight.key, saveEdit)}
					label={`highlight-${highlight.key}-label`}
					newLabel={highlight.newLabel}
					onChangeLabel={(e) => updateHighlights(highlight.key, setHighlightProp('newLabel', e.target.value))}
					keywords={`highlight-${highlight.key}-keywords`}
					newKeywords={highlight.newKeywords}
					onChangeKeywords={(e) => updateHighlights(highlight.key, setHighlightProp('newKeywords', e.target.value))}
				/>
			) : (
				<>
					<td><button onClick={() => deleteHighlight(highlight.key)}>Delete</button></td>
					<td><button onClick={() => updateHighlights(highlight.key, setHighlightProp('isEditing', true))}>Edit</button></td>
					<td>{highlight.label}</td>
					<td>{highlight.keywords}</td>
				</>
			)}
		</tr>
	))

	function addHighlight(label, keywords) {
		props.setHighlights(addKeyword(highlights, label, keywords))
	}

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
