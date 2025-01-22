function JobEdit(props) {
	function handleSubmit(event) {
		event.preventDefault()

		props.onSubmit()
	}

	return (
		<form onSubmit={handleSubmit}>
			<input
				defaultValue={props.newTitle}
				onChange={props.onChangeTitle}
				type='text'
			/>
			<br/>
			<input
				defaultValue={props.newUrl}
				onChange={props.onChangeUrl}
				type='text'
			/>
			<br/>
			<br/>
			<button type='submit'>Finish Editing</button>
		</form>
	)
}

export default JobEdit
