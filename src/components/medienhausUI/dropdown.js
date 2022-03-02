/*
The component expects an object for props.options in the style of:

const options = {
  value1: "Label for value1",
  value2: "Label for value2",
  value3: "Label for value3"
}

*/

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
  console.log(props.options)
  return (
    <>
      <Dropdown>
        <label htmlFor={props.name}><h3>{props.label}</h3></label>
        <select id={props.name} name={props.name} value={props.value} defaultValue="" onChange={props.onChange}>
          {props.placeholder && <option value="" disabled hidden>{props.placeholder}</option>}
          {Object.keys(props.options).map((option, index) => {
            return <option value={option} key={option + index}>{props.options[option]}</option>
          })}
        </select>
      </Dropdown>
    </>

  )
}
export default InputField
