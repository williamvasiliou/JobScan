function SectionEdit(props) {
	const header = props.header
	const content = props.content

	return (
		<>
			<label htmlFor={header}>Header:</label>
			<br/>
			<input
				id={header}
				defaultValue={props.newHeader}
				onChange={props.onChangeHeader}
				type='text'
				autoFocus
			/>
			<br/>
			<label htmlFor={content}>Content:</label>
			<br/>
			<textarea
				id={content}
				rows='30'
				cols='60'
				defaultValue={props.newContent}
				onChange={props.onChangeContent}
			>
			</textarea>
		</>
	)
}

export default SectionEdit
