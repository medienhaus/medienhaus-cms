import React from 'react'
import styled from 'styled-components'

const Button = styled.button`
  -webkit-appearance: none;
  -moz-appearance: none;
  color: var(--color-fg);
  appearance: none;
  background:none;
  border: none;
  border-bottom: 4px solid black;
  cursor: pointer;
  height: calc(var(--margin) * 2);
  padding: calc(var(--margin) * 0.6);
  margin-top: calc(var(--margin) * 0.2);
  width: ${props => props.width || '100%'};

  &:[disabled]{
  background:none;
  border: none;
  border-bottom: none;
  cursor: not-allowed;
}
`

const TextNavigation = (props) => {
  return (
    <Button
      value={props.value}
      cancel={props.cancel}
      onClick={props.onClick}
      disabled={props.disabled}
      width={props.width}
      active={props.active}
    >{props.children}
    </Button>
  )
}
export default TextNavigation
