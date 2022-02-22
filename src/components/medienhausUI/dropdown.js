import React from 'react'
import styled from 'styled-components'

const Dropdown = styled.section`
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
const InputField = (props) => {
  return (
    <>
      <Dropdown>
        <label htmlFor={props.name}><h3>{props.label}</h3></label>
        <select id={props.name} name={props.name} value={props.value} defaultValue="" onChange={props.onChange}>
          {props.placeholder && <option value="" disabled hidden>{props.placeholder}</option>}
          {props.options.map((option, index) => {
            return <option value={option} key={option + index}>{option}</option>
          })}
        </select>
      </Dropdown>
    </>

  )
}
export default InputField
