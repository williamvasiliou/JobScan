import { useState } from 'react'

import KeywordAdd from '/src/forms/KeywordAdd'
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

	const {
		colors, setColors,
		highlights, setHighlights,
		setSectionProp,
		saveSection, deleteSection,
		splitSection, joinSection,
		isViewing,
		moveFirst, moveUp,
		moveDown, moveLast,
	} = props

	const [checkedHighlights, setCheckedHighlights] = useState(props.checkedHighlights)

	function updateSectionProp(prop) {
		return (value) => props.updateSection(section, setSectionProp(prop, value))
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

		return next && isViewing(next.item)
	}

	function newJoin() {
		if (canJoin()) {
			updateAction(ACTION.JOINING)
		}
	}

	if ((action === ACTION.JOINING) && !canJoin()) {
		updateAction(ACTION.VIEWING)
	}

	function newSearch() {
		updateActionWithState(ACTION.SEARCHING, {
			find: {
				label: '',
				keywords: '',
			},
			color: '#ff0000',
		})
	}

	function editSearch(find, prop) {
		return (value) => {
			if (find) {
				actionState.find[prop] = value
			} else {
				actionState[prop] = value
			}

			updateActionProp({
				type: ACTION.SEARCHING,
				state: {
					...actionState,
				},
			})
		}
	}

	const callbacks = {
		[ACTION.VIEWING]: {
			edit: () => updateAction(ACTION.EDITING),
			delete: () => updateAction(ACTION.DELETING),
			split: newSplit,
			join: newJoin,
			move: () => updateAction(ACTION.MOVING),
			search: newSearch,
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
					saveSection(section, savedHeader, savedContent)
				} else {
					updateSection('newHeader', header)
					updateSection('newContent', content)
				}

				updateAction(ACTION.VIEWING)
			},
		},
		[ACTION.DELETING]: {
			delete: () => deleteSection(node),
		},
		[ACTION.SPLITTING]: {
			up: splitUp,
			down: splitDown,
			split: () => splitSection(node),
		},
		[ACTION.JOINING]: {
			join: () => joinSection(node),
		},
		[ACTION.MOVING]: {
			first: () => moveFirst(node),
			up: () => moveUp(node),
			down: () => moveDown(node),
			last: () => moveLast(node),
		},
		[ACTION.SEARCHING]: {
			keyword: async () => await addKeyword(actionState.find.label, actionState.find.keywords, actionState.color.replace('#', ''), colors, setColors, highlights, setHighlights),
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
						<KeywordAdd
							id={index}
							onSubmit={addKeyword}
							label={actionState.find.label}
							setLabel={editSearch(true, 'label')}
							keywords={actionState.find.keywords}
							setKeywords={editSearch(true, 'keywords')}
							color={actionState.color}
							setColor={editSearch(false, 'color')}
						/>
						<br/>
						<Highlighted
							index={index}
							highlights={highlights}
							searchColor={actionState.color.replace('#', '')}
							searchHighlight={actionState.find.keywords.trim()}
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
