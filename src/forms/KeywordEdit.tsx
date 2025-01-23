function KeywordEdit(props) {
	const label = props.label
	const keywords = props.keywords

	return (
		<>
			<td><button onClick={props.onClickCancel}>Cancel</button></td>
			<td><button onClick={props.onClickSave}>Save</button></td>
			<td>
				<label htmlFor={label}>Label:</label>
				<br/>
				<input
					id={label}
					defaultValue={props.newLabel}
					onChange={props.onChangeLabel}
					type='text'
				/>
			</td>
			<td>
				<label htmlFor={keywords}>Keywords:</label>
				<br/>
				<textarea
					id={keywords}
					rows='4'
					cols='27'
					defaultValue={props.newKeywords}
					onChange={props.onChangeKeywords}
				>
				</textarea>
			</td>
		</>
	)
}

export default KeywordEdit
