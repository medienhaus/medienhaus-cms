import React from 'react'
import styled from 'styled-components'

/*
  This simple button looks exactly like a standard <button>, but less heavy by using the same background color
  as the page.
 */

const Button = styled.button`
  width: ${props => props.width || '100%'};
  background: none;
  color: inherit;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  outline: inherit;
  height: unset;
  width: unset;
  text-transform: unset;

  &:disabled {
    background-color: var(--color-me);
    border-color: var(--color-me);
    cursor: not-allowed;
}
 &:hover {
    text-decoration: underline;
}
`

const UnstyledButton = (props) => {
  return (
    <Button
      value={props.value}
      onClick={props.onClick}
      disabled={props.disabled}
      width={props.width}
    >{props.children}
    </Button>
  )
}

export default UnstyledButton
