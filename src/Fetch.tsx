export const base = 'http://localhost:5173'

export const jobTake = 5

export async function fetchCreate(resource, body) {
	const response = await fetch(`${base}${resource}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	})

	if (response.ok) {
		return await response.json()
	}

	return false
}

export async function fetchRead(resource) {
	const response = await fetch(`${base}${resource}`)

	if (response.ok) {
		return await response.json()
	}

	return false
}

export async function fetchUpdate(resource, body) {
	const response = await fetch(`${base}${resource}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	})

	if (response.ok) {
		return await response.json()
	}

	return false
}

export async function fetchDelete(resource) {
	const response = await fetch(`${base}${resource}`, {
		method: 'DELETE',
	})

	if (response.ok) {
		return await response.json()
	}

	return false
}
