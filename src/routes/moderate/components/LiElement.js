import React from 'react'
import UlElement from './UlElement'
import { ReactComponent as ArrowRight } from '../../../assets/icons/remix/arrow-right.svg'
import { ReactComponent as ArrowDown } from '../../../assets/icons/remix/arrow-down.svg'

const LiElement = (props) => {
  return (
    <>
      <li onClick={() => props.callback(props.roomId, props.type)} className={props.roomId === props.active ? 'selected' : null} style={{ 'text-indent': `calc(1em * ${props.indent})` }} data-name={props.roomId} value={props.roomId}>
        {props.roomId === props.active && !props.content.includes(props.type) ? <ArrowDown fill="var(--color-fg)" /> : props.content.includes(props.type) ? '' : <ArrowRight fill="var(--color-fg)" />}
        {props.name}
      </li>
      {props.roomId === props.active &&
        <UlElement
          roomId={props.roomId} indent={props.indent + 1}
          removeContentElement={props.removeContentElement}
        />}
    </>
  )
}
export default LiElement
