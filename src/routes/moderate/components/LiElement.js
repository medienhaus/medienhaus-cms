import React, { useState } from 'react'
import styled from 'styled-components'

import { ReactComponent as ArrowRight } from '../../../assets/icons/remix/arrow-right.svg'
import { ReactComponent as ArrowDown } from '../../../assets/icons/remix/arrow-down.svg'

import Matrix from '../../../Matrix'
import UlElement from './UlElement'
import DeleteButton from '../../create/components/DeleteButton'

const ListElement = styled.li`
  display: flex;
  margin-left: calc(2em * ${props => props.indent});
  margin-bottom: calc(var(--margin) / 2);
`
const LiElement = ({ roomId, type, name, parent, indent, item, onElementRemoved }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [feedback, setFeedback] = useState('')

  const handleRemoveClick = async () => {
    await Matrix.removeSpaceChild(parent, roomId).catch((e) => {
      setFeedback(e?.message)
      setTimeout(() => setFeedback(''), 2500)
    })
    onElementRemoved() // delete li element
  }

  return (
    <div>
      <ListElement
        onClick={() => setIsExpanded(isExpanded => !isExpanded)}
        className={isExpanded ? 'selected' : null}
        data-name={roomId}
        value={roomId}
        indent={indent}
      >
        <span style={{
          display: 'flex',
          alignSelf: 'center'
        }}
        >{isExpanded && !item.includes(type) ? <ArrowDown fill="var(--color-fg)" /> : item.includes(type) ? '' : <ArrowRight fill="var(--color-fg)" />}</span>
        <span style={{
          display: 'flex',
          alignSelf: 'center'
        }}
        >{name}</span>
        {item.includes(type) && <DeleteButton
          width="5vw"
          onDelete={handleRemoveClick}
                                />}
      </ListElement>

      {isExpanded &&
        <UlElement
          roomId={roomId} indent={indent + 1}
        />}
      {feedback && <p>{feedback}</p>}
    </div>
  )
}

export default LiElement
