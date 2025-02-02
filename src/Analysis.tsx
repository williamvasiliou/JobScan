import { query } from '/src/Search'

import { fetchCreate } from '/src/Fetch'

export const addAnalysis = async (search, analysis, setAnalysis) => {
	const newAnalysis = await fetchCreate('/analysis', query(search).reduce((items, item) => {
		const [key, value] = item.split('=')

		return {
			...items,
			[key]: value,
		}
	}, {}))

	if (newAnalysis) {
		setAnalysis([
			...analysis,
			newAnalysis,
		])

		return true
	}

	return false
}
