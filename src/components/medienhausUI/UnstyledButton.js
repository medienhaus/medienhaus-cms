import React from 'react'
import styled from 'styled-components'

const Button = styled.button`
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
    width: ${props => props.width || '100%'};

  &: [disabled]{
  background - color: var(--color - me);
  border - color: var(--color - me);
  cursor: not - allowed;

}
`

const UnstyledButton = (props) => {
  return (
    <Button
      onClick={props.onClick}
      disabled={props.disabled}
      width={props.width}
    >{props.children}
    </Button>
  )
}
export default UnstyledButton
