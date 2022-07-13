import React from 'react'
import { Loading } from './loading'
import styled from 'styled-components'

const Wrapper = styled.div`
  position: relative;

  .loading {
    border-color: var(--color-me) transparent var(--color-me) transparent;
    max-height: calc(var(--margin) * 1.15);
    max-width: calc(var(--margin) * 1.15);
  }
`

const LoadingSpinnerSelect = () => {
  return (
    <Wrapper>
      <div style={{ position: 'absolute', left: 'var(--margin)', top: '50%', transform: 'translateY(-50%)' }}><Loading /></div>
      <select key="loading" disabled><option /></select>
    </Wrapper>
  )
}

export default LoadingSpinnerSelect
