import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import { useTranslation } from 'react-i18next'
import config from '../../../config.json'

function CreateContext (props) {
  const [contextName, setContextName] = useState('')
  const [template, setTemplate] = useState('')
  const { t } = useTranslation('admin')
  const [loading, setLoading] = useState(false)

  const handleClick = async (e) => {
    setLoading(true)
    await props.callback(e, contextName, template, () => { setContextName(''); setTemplate('') })
    setLoading(false)
  }
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
          <select value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option disabled value="">-- {t('select context type')} --</option>
            {Object.keys(config.medienhaus.context).map(context => {
              return <option key={config.medienhaus.context[context].label} value={context}>{config.medienhaus.context[context].label}</option>
            })}
          </select>
        </section>}
      <button type="submit" disabled={props.disableButton || !contextName || !template || loading} onClick={handleClick}>{props.loading || loading ? <Loading /> : props.t('Add Context')}</button>
    </>
  )
}
export default CreateContext
