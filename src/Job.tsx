import { iso } from './Content'

export const ADD = 0
export const LIST = 1
export const VIEW = 2
export const ANALYSIS = 3

export const ITEM = {
	id: 0,
	action: 'Compact',
	[LIST]: true,
	item: (view, edit) => (
		({ id, title, url }) => (
			<li key={id}>
				<div onClick={() => view(id)}>
					<hr/>
					<div>#{id}</div>
					<strong>{title}</strong>
				</div>
				{url ?
					<a href={url} target='_blank'>{url}</a>
				:
					<button onClick={() => edit(id)}>
						<em>Click to add URL</em>
					</button>
				}
				<br/>
				<br/>
			</li>
		)
	),
}

export const ACTIONS = [
	ITEM,
	{
		id: 1,
		action: 'Detailed',
		[LIST]: false,
		header: (
			<thead>
				<tr>
					<td>Job</td>
					<td>Title</td>
					<td>URL</td>
					<td>Created At</td>
					<td>Updated At</td>
					<td>Published At</td>
				</tr>
			</thead>
		),
		item: (view, edit) => (
			({ id, title, url, createdAt, updatedAt, published }) => (
				<tr key={id}>
					<td onClick={() => view(id)}>
						#{id}
					</td>
					<td onClick={() => view(id)}>
						<strong>{title}</strong>
					</td>
					<td>
						{url ?
							<a href={url} target='_blank'>{url}</a>
						:
							<button onClick={() => edit(id)}>
								<em>Click to add URL</em>
							</button>
						}
					</td>
					<td onClick={() => view(id)}>
						{iso(createdAt)}
					</td>
					<td onClick={() => view(id)}>
						{iso(updatedAt)}
					</td>
					<td onClick={() => view(id)}>
						{iso(published)}
					</td>
				</tr>
			)
		),
	},
]
