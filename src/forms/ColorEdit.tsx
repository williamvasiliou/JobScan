function ColorEdit(props) {
	const color = `color-${props.colorId}`

	return (
		<>
			{props.isColoring ? (
				<>
					<label htmlFor={`new-color-${props.id}`}>Color:</label>
					<br/>
					<input
						id={`new-color-${props.id}`}
						defaultValue={props.newColor}
						onChange={(e) => props.setNewColor(e.target.value)}
						type='color'
					/>
					<div className='color-editing'>
						<input
							id={`update-color-${props.id}`}
							defaultChecked={props.isUpdating}
							onChange={(e) => props.setUpdating(e.target.checked)}
							type='checkbox'
						/>
						<label htmlFor={`update-color-${props.id}`}>Update All</label>
						<br/>
						<button onClick={props.cancel}>Cancel</button>
						<button onClick={props.save}>Save</button>
					</div>
				</>
			) : (
				<button
					className={`color-edit ${color}`}
					onClick={props.edit}
				>
					<span className={`highlighted ${color}`}>Color</span>
				</button>
			)}
		</>
	)
}

export default ColorEdit
