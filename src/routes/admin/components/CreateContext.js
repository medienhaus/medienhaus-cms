import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import config from '../../../config.json'

function CreateContext (props) {
  const [contextName, setContextName] = useState('')
  const [template, setTemplate] = useState('')

  return (
    <form>
      <div>
        <label htmlFor="name">{props.t('Sub-Context Name')}: </label>
        <input type="text" value={contextName} onChange={(e) => setContextName(e.target.value)} />
      </div>
      {config.medienhaus.context &&
        <div>
          <label htmlFor="template">{props.t('Type of Context')}: </label>
          <select value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option disabled value="">--- Please choose a type of context ---</option>
            {Object.keys(config.medienhaus.context).map(context => {
              return <option key={config.medienhaus.context[context].label} value={context}>{config.medienhaus.context[context].label}</option>
            })}
          </select>
        </div>}
      <button type="submit" disabled={props.disableButton || !contextName || !template} onClick={(e) => props.callback(e, contextName, template, () => { setContextName(''); setTemplate('') })}>{props.loading ? <Loading /> : props.t('Add Context')}</button>
    </form>
  )
}
export default CreateContext
