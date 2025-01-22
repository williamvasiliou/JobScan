function JobHead(props) {
	const url = props.url

	return (
		<>
			<h2>{props.title}</h2>
			{url ? (
				<>
					<a href={url} target='_blank'>{url}</a>
					<br/>
					<br/>
					<button onClick={props.setEditing}>Edit</button>
				</>
			) : (
				<button onClick={props.setEditing}><em>Click to add URL</em></button>
			)}
		</>
	)
}

export default JobHead
