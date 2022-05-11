import React, { useState } from 'react'
import { Loading } from '../../../components/loading'

function CreateContext (props) {
  const [contextName, setContextName] = useState('')
  const [template, setTemplate] = useState('')

  return (
    <form>
      <div>
        <label htmlFor="name">{props.t('Add Sub-Context')}: </label>
        <input type="text" value={contextName} onChange={(e) => setContextName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="template">{props.t('Type of Context')}: </label>
        <select onChange={(e) => setTemplate(e.target.value)}>
          <option disabled value="">--- Please choose a type of context ---</option>
          <option value="Faculty">Faculty</option>
          <option value="Class">Class</option>
          <option value="Seminar">Seminar</option>
        </select>
      </div>

      <button type="submit" disabled={props.disableButton || !contextName || !template} onClick={(e) => props.callback(e, contextName, template, () => { setContextName(''); setTemplate('') })}>{props.loading ? <Loading /> : props.t('Add Context')}</button>
    </form>
  )
}
export default CreateContext
