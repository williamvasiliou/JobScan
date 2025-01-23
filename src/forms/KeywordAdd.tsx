import { useState } from 'react'

function KeywordAdd(props) {
	const [label, setLabel] = useState('')
	const [keywords, setKeywords] = useState('')

	function handleSubmit(event) {
		event.preventDefault()

		props.onSubmit(label, keywords)
	}

	return (
		<form onSubmit={handleSubmit}>
			<label htmlFor='label'>Label:</label>
			<br/>
			<input
				id='label'
				defaultValue={label}
				onChange={(e) => setLabel(e.target.value)}
				type='text'
			/>
			<br/>
			<label htmlFor='keywords'>Keywords:</label>
			<br/>
			<textarea
				id='keywords'
				rows='9'
				cols='54'
				defaultValue={keywords}
				onChange={(e) => setKeywords(e.target.value)}
			>
			</textarea>
			<br/>
			<button type='submit'>Add</button>
		</form>
	)
}

export default KeywordAdd
