import React from 'react'
import styled from 'styled-components'

const Button = styled.button`
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: var(--color-bg);
  border: none;
  color: var(--color-me);
  cursor: pointer;
  height: 100%;
  padding: calc(var(--margin) * 0.2);
  width: ${props => props.width || '100%'};

  &[disabled] {
    background-color: var(--color-bg);
    border-bottom-color: var(--color-fg);
    border-bottom-radius: unset;
    border-bottom-style: solid;
    border-bottom-width: calc(var(--margin) * 0.2);
    color: var(--color-fg);
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
      // active={props.active}
    >{props.children}
    </Button>
  )
}

export default TextNavigation
