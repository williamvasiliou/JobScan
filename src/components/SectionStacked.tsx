function SectionStacked(props) {
	return (
		<div className='lines'>
			<div>{props.up}</div>
			<div className={props.className}>
				<h4>{props.header}</h4>
				<div>{props.down}</div>
			</div>
		</div>
	)
}

export default SectionStacked
