import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import config from '../../../config.json'

function CreateContext (props) {
  const [contextName, setContextName] = useState('')
  const [template, setTemplate] = useState('')

  return (
    <>
      <section className="manage--add-subcontext--title">
        <label>
          <h3>{props.t('Name / Title')}</h3>
        </label>
        <input type="text" value={contextName} onChange={(e) => setContextName(e.target.value)} />
      </section>
      {config.medienhaus.context &&
        <section className="manage--add-subcontext--type">
          <label>
            <h3>{props.t('Type')}</h3>
          </label>
          <select defaultValue="" onChange={(e) => setTemplate(e.target.value)}>
            <option disabled value="">--- please choose a context type ---</option>
            {Object.keys(config.medienhaus.context).map(context => {
              return <option key={config.medienhaus.context[context].label} value={context}>{config.medienhaus.context[context].label}</option>
            })}
          </select>
        </section>}
      <button type="submit" disabled={props.disableButton || !contextName || !template} onClick={(e) => props.callback(e, contextName, template, () => { setContextName(''); setTemplate('') })}>{props.loading ? <Loading /> : props.t('Add Context')}</button>
    </>
  )
}
export default CreateContext
