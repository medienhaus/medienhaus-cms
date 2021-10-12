import React from 'react'

function CreateContext (props) {
  return (
    <form>

      <div>
        <label htmlFor="name">{props.t('Context')}: </label>
        <input type="text" onChange={(e) => props.setNewContext(e.target.value)} />
      </div>

      <button type="submit" onClick={(e) => props.callback(e)}>{props.t('SUBMIT')}</button>
    </form>
  )
}
export default CreateContext
