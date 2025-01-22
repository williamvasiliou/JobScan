export const node = (item) => (
	{
		item: item,
		previous: 0,
		next: 0,
	}
)

export const create = (item) => {
	const list = node(item)

	return ({
		head: list,
		tail: list,
	})
}

export const remove = (list, node) => {
	const previous = node.previous
	const next = node.next

	if (previous || next) {
		if (previous) {
			previous.next = next
		} else {
			list.head = next
		}

		if (next) {
			next.previous = previous
		} else {
			list.tail = previous
		}

		return true
	}

	return false
}

export const split = (list, first, up, down) => {
	const next = first.next
	const newNext = node(down)

	first.item = up

	if (next) {
		next.previous = newNext
		newNext.next = next

		newNext.previous = first
		first.next = newNext
	} else {
		newNext.previous = first
		first.next = newNext

		list.tail = newNext
	}
}

export const join = (list, node, glues, glue) => {
	const next = node.next

	if (next) {
		const nextItem = next.item

		if (glues(nextItem)) {
			node.item = glue(node.item, nextItem)

			const nextNext = next.next

			if (nextNext) {
				nextNext.previous = node
				node.next = nextNext
			} else {
				node.next = nextNext

				list.tail = node
			}

			return true
		}
	}

	return false
}

export const moveFirst = (list, node) => {
	const previous = node.previous

	if (previous) {
		const headItem = list.head.item

		list.head.item = node.item
		node.item = headItem

		return true
	}

	return false
}

export const moveUp = (list, node) => {
	const previous = node.previous

	if (previous) {
		const previousItem = previous.item

		previous.item = node.item
		node.item = previousItem

		return true
	}

	return false
}

export const moveDown = (list, node) => {
	const next = node.next

	if (next) {
		const nextItem = next.item

		next.item = node.item
		node.item = nextItem

		return true
	}

	return false
}

export const moveLast = (list, node) => {
	const next = node.next

	if (next) {
		const tailItem = list.tail.item

		list.tail.item = node.item
		node.item = tailItem

		return true
	}

	return false
}

export const each = (list, update) => {
	let head = list.head

	while (head) {
		update(head.item)

		head = head.next
	}
}

export const items = (list) => {
	let head = list.head

	const items = []

	while (head) {
		items.push(head.item)

		head = head.next
	}

	return items
}

export const list = (items, item) => {
	let head = items.head

	const list = []

	while (head) {
		list.push(item(list.length, head.item))

		head = head.next
	}

	return list
}

export const nodes = (items, item) => {
	let head = items.head

	const list = []

	while (head) {
		list.push(item(list.length, head))

		head = head.next
	}

	return list
}
