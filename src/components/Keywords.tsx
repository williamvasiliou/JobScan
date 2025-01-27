import { style, saveKeyword, saveColor, deleteKeyword, cancelEdit, cancelColor, byLabel } from '/src/Keyword'

import ColorEdit from '/src/forms/ColorEdit'
import KeywordEdit from '/src/forms/KeywordEdit'

function Keywords(props) {
	const {
		children,
		colors, setColors,
		highlights, setHighlights,
	} = props

	function updateColor(id, colorId, color, newColor) {
		setColors({
			...colors,
			[colorId]: newColor,
		})

		setHighlights(highlights.map((highlight) => {
			if (highlight.colorId === colorId || highlight.color === newColor) {
				highlight.colorId = colorId
				highlight.color = newColor

				if (!highlight.isColoring || highlight.newColor === color || highlight.id === id) {
					highlight.isColoring = false
					highlight.isUpdatingColor = false

					highlight.newColor = newColor
				}
			}

			return highlight
		}))
	}

	function updateHighlights({ id, label }, update) {
		let low = 0
		let high = highlights.length - 1

		while (high >= low) {
			if (high === low) {
				const highlight = highlights[low]

				if (highlight.id === id) {
					highlights[low] = update(highlight)

					setHighlights([...highlights].sort(byLabel))
				}

				break
			} else {
				const index = (low >> 1) + (high >> 1)
				const highlight = highlights[index]

				if (highlight.id === id) {
					highlights[index] = update(highlight)

					setHighlights([...highlights].sort(byLabel))

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

	async function saveHighlight(highlight) {
		await saveKeyword(highlight, updateHighlights)
	}

	async function saveHighlightColor(highlight) {
		await saveColor(highlight, updateColor, colors, setColors, updateHighlights)
	}

	async function deleteHighlight({ id }) {
		await deleteKeyword(highlights, id, setHighlights)
	}

	function colorEdit(highlight) {
		return (
			<ColorEdit
				id={highlight.id}
				colorId={highlight.colorId}
				isColoring={highlight.isColoring}
				newColor={`#${highlight.newColor}`}
				setNewColor={(value) => updateHighlights(highlight, setHighlightProp('newColor', value.replace('#', '')))}
				isUpdating={highlight.isUpdatingColor}
				setUpdating={(value) => updateHighlights(highlight, setHighlightProp('isUpdatingColor', value))}
				cancel={() => updateHighlights(highlight, cancelColor(props.colors))}
				save={() => saveHighlightColor(highlight)}
				edit={() => updateHighlights(highlight, setHighlightProp('isColoring', true))}
			/>
		)
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
					colorEdit={colorEdit(highlight)}
				/>
			) : (
				<>
					<td><button onClick={() => deleteHighlight(highlight)}>Delete</button></td>
					<td><button onClick={() => updateHighlights(highlight, setHighlightProp('isEditing', true))}>Edit</button></td>
					<td>{colorEdit(highlight)}</td>
					<td>{highlight.label}</td>
					<td>{highlight.keywords}</td>
				</>
			)}
		</tr>
	))

	return (
		<>
			<style>
				{style(colors)}
			</style>
			{children}
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
