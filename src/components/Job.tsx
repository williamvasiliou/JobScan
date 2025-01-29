import { useState } from 'react'

import JobEdit from '/src/forms/JobEdit'

import JobHead from './JobHead'
import Section from './Section'

import * as Content from '/src/Content'
import * as List from '/src/List'

import { VIEWING } from '/src/Action'
import { style } from '/src/Keyword'

import { fetchCreate, fetchUpdate, fetchDelete } from '/src/Fetch'

function Job(props) {
	const {
		job, updateJob,
		colors, setColors,
		highlights, setHighlights,
	} = props

	const {
		title, newTitle,
		url, newUrl,
		isEditing,
	} = job

	const [sections, setSections] = useState(job.sections)

	function finishEditingTitleUrl() {
		const title = Content.newTitle(job.newTitle)
		const url = job.newUrl.trim()

		return title ? (
			(job) => ({
				...job,
				title: title,
				newTitle: title,
				url: url,
				newUrl: url,
				isEditing: false,
			})
		) : (
			(job) => ({
				...job,
				newTitle: job.title,
				newUrl: job.url,
				isEditing: false,
			})
		)
	}

	function updateProp(prop, value) {
		return (job) => ({
			...job,
			[prop]: value,
		})
	}

	function setSectionProp(prop, value) {
		return (section) => {
			section[prop] = value
			return {...sections}
		}
	}

	function updateSection(section, update) {
		setSections(update(section))
	}

	function finishUpdateSections() {
		setSections({...sections})
	}

	async function saveSection(section, header, content) {
		section.header = header
		section.content = content

		const newSection = await fetchUpdate(`/sections/${section.id}`, Content.Section.toPrisma(section))

		if (newSection) {
			finishUpdateSections()
		}
	}

	async function deleteSection(node) {
		const section = await fetchDelete(`/sections/${node.item.id}`)

		if (section && List.remove(sections, node)) {
			finishUpdateSections()
		}
	}

	async function splitSection(node) {
		const section = node.item
		const content = section.action.state?.content

		if (content && content.up && content.header && content.down) {
			section.action.type = VIEWING
			section.action.state = 0

			section.content = content.up
			section.newContent = section.content

			const tailSection = await fetchCreate(`/jobs/${job.id}/sections`, {
				header: content.header,
				content: content.down,
			})

			const newSection = await fetchUpdate(`/sections/${section.id}`, Content.Section.toPrisma(section))

			if (tailSection && newSection) {
				const newNode = List.node(Content.Section.fromPrisma(tailSection))

				newNode.previous = sections.tail
				sections.tail.next = newNode
				sections.tail = newNode

				finishUpdateSections()
			}
		}
	}

	function isViewing(section) {
		return section.action.type === VIEWING
	}

	async function joinSection(node) {
		const section = node.item
		const next = node.next?.item

		const id = section.id
		const nextId = next?.id

		if (List.join(sections, node, isViewing, Content.Section.glue)) {
			const newSection = await fetchUpdate(`/sections/${id}`, Content.Section.toPrisma(section))

			const nextSection = await fetchDelete(`/sections/${nextId}`)

			if (newSection && nextSection) {
				finishUpdateSections()
			}
		}
	}

	async function moveSections(section, newSection) {
		const id = section.id
		const newId = newSection.id

		const sections = await fetchUpdate(`/sections/${id}/move`, {
			newId: newId,
		})

		if (sections) {
			const { isExpanded, action } = section

			Content.Section.hydrate(section, sections[0])
			Content.Section.hydrate(newSection, sections[1])

			section.isExpanded = newSection.isExpanded
			section.action = newSection.action

			newSection.isExpanded = isExpanded
			newSection.action = action

			finishUpdateSections()
		}
	}

	async function moveSectionFirst(node) {
		if (node.previous) {
			await moveSections(node.item, sections.head.item)
		}
	}

	async function moveSectionUp(node) {
		if (node.previous) {
			await moveSections(node.item, node.previous.item)
		}
	}

	async function moveSectionDown(node) {
		if (node.next) {
			await moveSections(node.item, node.next.item)
		}
	}

	async function moveSectionLast(node) {
		if (node.next) {
			await moveSections(node.item, sections.tail.item)
		}
	}

	const sectionsList = List.nodes(sections, (key, node) => (
		<Section
			key={node.item.id}
			index={node.item.id}
			node={node}
			colors={colors}
			setColors={setColors}
			checkedHighlights={highlights?.map(() => false)}
			highlights={highlights}
			setHighlights={setHighlights}
			setSectionProp={setSectionProp}
			updateSection={updateSection}
			saveSection={saveSection}
			deleteSection={deleteSection}
			splitSection={splitSection}
			joinSection={joinSection}
			isViewing={isViewing}
			moveFirst={moveSectionFirst}
			moveUp={moveSectionUp}
			moveDown={moveSectionDown}
			moveLast={moveSectionLast}
		/>
	))

	function collapseAll() {
		List.each(sections, (section) => (
			section.isExpanded = false
		))
		finishUpdateSections()
	}

	function expandAll() {
		List.each(sections, (section) => (
			section.isExpanded = true
		))
		finishUpdateSections()
	}

	return (
		<>
			{isEditing ? (
				<JobEdit
					newTitle={newTitle}
					onChangeTitle={(e) => updateJob(updateProp('newTitle', e.target.value))}
					newUrl={newUrl}
					onChangeUrl={(e) => updateJob(updateProp('newUrl', e.target.value))}
					onSubmit={() => props.saveJob(finishEditingTitleUrl())}
				/>
			) : (
				<JobHead
					title={title}
					url={url}
					setEditing={() => updateJob(updateProp('isEditing', true))}
				/>
			)}
			{sections.head.next ? (
				<>
					<br/>
					<br/>
					<button onClick={collapseAll}>Collapse all</button>
					<button onClick={expandAll}>Expand all</button>
				</>
			) : (
				[]
			)}
			<style>
				{style(colors)}
			</style>
			{sectionsList}
		</>
	)
}

export default Job
