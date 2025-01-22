import { useState } from 'react'

import JobEdit from '/src/forms/JobEdit'

import JobHead from './JobHead'
import Section from './Section'

import * as Content from '/src/Content'
import * as List from '/src/List'

import { VIEWING } from '/src/Action'

function Job(props) {
	const index = props.index
	const [job, setJob] = useState(props.jobs[index])

	const title = job.title
	const newTitle = job.newTitle

	const url = job.url
	const newUrl = job.newUrl

	const isEditing = job.isEditing

	const sections = job.sections

	function updateJob(update) {
		props.updateJob(index, update)
		setJob(props.getJob(index))
	}

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
		updateJob(updateProp('sections', update(section)))
	}

	function finishUpdateSections() {
		updateJob(updateProp('sections', {...sections}))
	}

	function deleteSection(node) {
		if (List.remove(sections, node)) {
			finishUpdateSections()
		}
	}

	function splitSection(node) {
		const section = node.item
		const content = section.action.state?.content

		if (content && content.up && content.header && content.down) {
			section.action.type = VIEWING
			section.action.state = 0

			section.content = content.up
			section.newContent = section.content

			List.split(sections, node, section, Content.Section.create(content.header, content.down))

			finishUpdateSections()
		}
	}

	function isViewing(section) {
		return section.action.type === VIEWING
	}

	function joinSection(node) {
		if (List.join(sections, node, isViewing, Content.Section.glue)) {
			finishUpdateSections()
		}
	}

	function moveSectionFirst(node) {
		if (List.moveFirst(sections, node)) {
			finishUpdateSections()
		}
	}

	function moveSectionUp(node) {
		if (List.moveUp(sections, node)) {
			finishUpdateSections()
		}
	}

	function moveSectionDown(node) {
		if (List.moveDown(sections, node)) {
			finishUpdateSections()
		}
	}

	function moveSectionLast(node) {
		if (List.moveLast(sections, node)) {
			finishUpdateSections()
		}
	}

	const sectionsList = List.nodes(sections, (key, node) => (
		<Section
			key={node.item.key}
			index={key}
			node={node}
			highlights={props.highlights}
			checkedHighlights={props.highlights?.map(() => false)}
			setHighlights={props.setHighlights}
			setSectionProp={setSectionProp}
			updateSection={updateSection}
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
					onSubmit={() => updateJob(finishEditingTitleUrl())}
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
			{sectionsList}
		</>
	)
}

export default Job
