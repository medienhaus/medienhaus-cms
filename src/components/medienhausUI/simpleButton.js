import React from 'react'
import styled from 'styled-components'

/*
  This simple button looks exactly like a standard <button>, but less heavy by using the same background color
  as the page.
 */

const Button = styled.button`
  background-color: ${props => props.cancel ? 'var(--color-bg)' : 'var(--color-fg)'};
  color: ${props => props.cancel ? 'var(--color-fg)' : 'var(--color-bg)'};
  width: ${props => props.width || '100%'};

  &[disabled] {
    background-color: var(--color-me);
    border-color: var(--color-me);
    cursor: not-allowed;
}
`

const SimpleButton = (props) => {
  return (
    <Button
      value={props.value}
      cancel={props.cancel}
      onClick={props.onClick}
      disabled={props.disabled}
      width={props.width}
    >{props.children}
    </Button>
  )
}

export default SimpleButton
