import React from 'react'
import styled from 'styled-components'

const Input = styled.div`
input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: var(--color-bg);
  border: unset;
  border-color: var(--color-fg);
  border-radius: unset;
  border-style: solid;
  border-width: calc(var(--margin) * 0.2);
  box-shadow: none;
  color: var(--color-fg);
  height: calc(var(--margin) * 2);
  /*
  outline: none;
  */
  padding: calc(var(--margin) * 0.2);
  width: 100%;
}
`
const InputField = ({ name, label, type, placeholder, value, onChange }) => {
  return (
    <>
      <Input>
        <label htmlFor={name}>{label}:</label>
        <input name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} />
      </Input>
    </>

  )
}
export default InputField
