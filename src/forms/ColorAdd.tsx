function ColorAdd(props) {
	const id = `new-color-add-${props.id}`

	return (
		<>
			<label htmlFor={id}>Color: </label>
			<input
				id={id}
				defaultValue={props.color}
				onChange={(e) => props.setColor(e.target.value)}
				type='color'
			/>
		</>
	)
}

export default ColorAdd
