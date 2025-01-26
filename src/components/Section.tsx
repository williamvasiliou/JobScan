import { useState } from 'react'

import SectionEdit from '/src/forms/SectionEdit'

import Highlighted from './Highlighted'
import SectionActions from './SectionActions'
import SectionStacked from './SectionStacked'

import * as Content from '/src/Content'
import { addKeyword } from '/src/Keyword'

import * as ACTION from '/src/Action'

function Section(props) {
	const index = props.index
	const node = props.node
	const section = node.item

	const isExpanded = section.isExpanded

	const action = section.action.type
	const actionState = section.action.state

	const header = section.header
	const newHeader = section.newHeader

	const content = section.content
	const newContent = section.newContent

	const highlights = props.highlights
	const [checkedHighlights, setCheckedHighlights] = useState(props.checkedHighlights)

	function updateSectionProp(prop) {
		return (value) => props.updateSection(section, props.setSectionProp(prop, value))
	}

	function updateSection(prop, value) {
		const update = updateSectionProp(prop)

		update(value)
	}

	const updateExpanded = updateSectionProp('isExpanded')
	const updateActionProp = updateSectionProp('action')

	function updateAction(action) {
		updateActionProp({
			type: action,
			state: 0,
		})
	}

	function updateActionWithState(action, state) {
		updateActionProp({
			type: action,
			state: state,
		})
	}

	function newSplit() {
		const lines = content.split('\n')

		if (lines.length > 2) {
			updateActionWithState(ACTION.SPLITTING, {
				line: 1,
				lines: lines,
				min: 1,
				max: lines.length - 2,
				content: Content.Section.newSplitContent(1, lines),
			})
		}
	}

	function editSplit(good, update) {
		return () => {
			if (good(actionState)) {
				actionState.content = Content.Section.newSplitContent(update(actionState), actionState.lines)

				updateActionProp({
					type: ACTION.SPLITTING,
					state: {
						...actionState,
					},
				})
			}
		}
	}

	const splitUp = editSplit(
		(state) => state.line > state.min,
		(state) => --state.line,
	)

	const splitDown = editSplit(
		(state) => state.line < state.max,
		(state) => ++state.line,
	)

	function canJoin() {
		const next = node.next

		return next && props.isViewing(next.item)
	}

	function newJoin() {
		if (canJoin()) {
			updateAction(ACTION.JOINING)
		}
	}

	if ((action === ACTION.JOINING) && !canJoin()) {
		updateAction(ACTION.VIEWING)
	}

	const callbacks = {
		[ACTION.VIEWING]: {
			edit: () => updateAction(ACTION.EDITING),
			delete: () => updateAction(ACTION.DELETING),
			split: newSplit,
			join: newJoin,
			move: () => updateAction(ACTION.MOVING),
			search: () => updateActionWithState(ACTION.SEARCHING, ''),
		},
		[ACTION.EDITING]: {
			cancel: () => {
				updateSection('newHeader', header)
				updateSection('newContent', content)
				updateAction(ACTION.VIEWING)
			},
			save: () => {
				const savedHeader = Content.newTitle(newHeader)
				const savedContent = Content.newContent(newContent)

				if (savedHeader && savedContent) {
					updateSection('newHeader', savedHeader)
					updateSection('newContent', savedContent)
					props.saveSection(section, savedHeader, savedContent)
				} else {
					updateSection('newHeader', header)
					updateSection('newContent', content)
				}

				updateAction(ACTION.VIEWING)
			},
		},
		[ACTION.DELETING]: {
			delete: () => props.deleteSection(node),
		},
		[ACTION.SPLITTING]: {
			up: splitUp,
			down: splitDown,
			split: () => props.splitSection(node),
		},
		[ACTION.JOINING]: {
			join: () => props.joinSection(node),
		},
		[ACTION.MOVING]: {
			first: () => props.moveFirst(node),
			up: () => props.moveUp(node),
			down: () => props.moveDown(node),
			last: () => props.moveLast(node),
		},
		[ACTION.SEARCHING]: {
			keyword: async () => props.setHighlights(await addKeyword(highlights, actionState, actionState)),
		},
	}

	const sectionHeader = (
		<>
			<hr/>
			{!action ?
				<h3>{header}</h3>
			:
				<h3>{ACTION.ACTIONS[action]} {header}...</h3>
			}
		</>
	)

	function sectionView() {
		switch(action) {
			case ACTION.VIEWING:
			case ACTION.DELETING:
			case ACTION.MOVING:
				return (
					<Highlighted
						index={index}
						highlights={highlights}
						checkedHighlights={checkedHighlights}
						setCheckedHighlights={setCheckedHighlights}
						content={content}
					/>
				)
			case ACTION.EDITING:
				return (
					<SectionEdit
						header={`section-${index}-header`}
						newHeader={newHeader}
						onChangeHeader={(e) => updateSection('newHeader', e.target.value)}
						content={`section-${index}-content`}
						newContent={newContent}
						onChangeContent={(e) => updateSection('newContent', e.target.value)}
					/>
				)
			case ACTION.SPLITTING:
				return (
					<SectionStacked
						up={actionState.content.up}
						className='splitting'
						header={actionState.content.header}
						down={actionState.content.down}
					/>
				)
			case ACTION.JOINING:
				return (
					<SectionStacked
						up={content}
						className='joining'
						header={node.next?.item.header}
						down={node.next?.item.content}
					/>
				)
			case ACTION.SEARCHING:
				return (
					<>
						<label htmlFor={`section-${index}-searching`}>Find:</label>
						<br/>
						<input
							id={`section-${index}-searching`}
							defaultValue={actionState}
							onChange={(e) => updateActionWithState(ACTION.SEARCHING, e.target.value)}
							type='text'
						/>
						<br/>
						<br/>
						<Highlighted
							index={index}
							highlights={highlights}
							searchHighlight={actionState.trim()}
							checkedHighlights={checkedHighlights}
							setCheckedHighlights={setCheckedHighlights}
							content={content}
						/>
					</>
				)
		}
	}

	return (
		<>
			{sectionHeader}
			<SectionActions
				section={section}
				setExpanded={updateExpanded}
				setAction={updateAction}
				callbacks={callbacks}
			/>
			{isExpanded ? (
				<>
					<br/>
					<br/>
					{sectionView()}
				</>
			) : (
				<br/>
			)}
		</>
	)
}

export default Section
