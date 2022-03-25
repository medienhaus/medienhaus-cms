import React, { useState } from 'react'
import UlElement from './UlElement'

import { ReactComponent as ArrowRight } from '../../../assets/icons/remix/arrow-right.svg'
import { ReactComponent as ArrowDown } from '../../../assets/icons/remix/arrow-down.svg'

import Matrix from '../../../Matrix'
import DeleteButton from '../../create/components/DeleteButton'

const LiElement = ({ roomId, type, name, parent, indent, content, onElementRemoved }) => {
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
      <li
        onClick={() => setIsExpanded(isExpanded => !isExpanded)}
        className={isExpanded ? 'selected' : null}
        style={{ paddingLeft: `calc(2em * ${indent})` }}
        data-name={roomId}
        value={roomId}
      >
        {isExpanded && !content.includes(type) ? <ArrowDown fill="var(--color-fg)" /> : content.includes(type) ? '' : <ArrowRight fill="var(--color-fg)" />}
        {name}
      </li>
      {content.includes(type) && <DeleteButton
        onDelete={handleRemoveClick}
                                 />}
      {isExpanded &&
        <UlElement
          roomId={roomId} indent={indent + 1}
        />}
      {feedback && <p>{feedback}</p>}
    </div>
  )
}
export default LiElement
