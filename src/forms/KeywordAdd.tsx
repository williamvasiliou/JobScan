import ColorAdd from './ColorAdd'

function KeywordAdd(props) {
	const {
		id, onSubmit,
		label, setLabel,
		keywords, setKeywords,
		color, setColor,
	} = props

	function handleSubmit(event) {
		event.preventDefault()

		onSubmit(label, keywords, color)
	}

	function setNewLabel(value) {
		if (label === keywords) {
			setLabel(value)
			setKeywords(value)
		} else {
			setLabel(value)
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			<label htmlFor={`label-adding-${id}`}>Label:</label>
			<br/>
			<div className='color-adding'>
				<ColorAdd
					id={id}
					color={color}
					setColor={setColor}
				/>
				<input
					id={`label-adding-${id}`}
					defaultValue={label}
					onChange={(e) => setNewLabel(e.target.value)}
					type='text'
				/>
			</div>
			<label htmlFor={`keywords-adding-${id}`}>Keywords:</label>
			<br/>
			<textarea
				id={`keywords-adding-${id}`}
				rows='9'
				cols='54'
				defaultValue={keywords}
				onChange={(e) => setKeywords(e.target.value)}
			>
			</textarea>
			<br/>
			{!id ? (
				<button type='submit'>Add</button>
			) : (
				[]
			)}
		</form>
	)
}

export default KeywordAdd
