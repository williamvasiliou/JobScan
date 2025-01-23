import { useState } from 'react'

function JobAdd(props) {
	const [title, setTitle] = useState(props.title)
	const [url, setUrl] = useState(props.url)
	const [header, setHeader] = useState(props.header)
	const [content, setContent] = useState(props.content)

	function reset() {
		setTitle('Untitled Job')
		setUrl('')
		setHeader('Description')
		setContent('')
	}

	function onSubmit() {
		if (props.onSubmit(title, url, header, content)) {
			reset()
		}
	}

	function submit(value) {
		setContent(value)

		if (props.onSubmit(title, url, header, value)) {
			reset()
		}
	}

	function handleSubmit(event) {
		event.preventDefault()

		onSubmit()
	}

	function handlePaste(event) {
		if (!event.target.value) {
			event.clipboardData.items[0]?.getAsString((value) => submit(value))
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			<textarea
				rows='30'
				cols='60'
				defaultValue = {content}
				onChange={(e) => setContent(e.target.value)}
				onPaste={handlePaste}
			>
			</textarea>
			<br/>
			<button type='submit'>Analyze</button>
		</form>
	)
}

export default JobAdd
