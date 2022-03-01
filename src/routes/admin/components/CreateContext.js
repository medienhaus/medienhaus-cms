import React, { useState } from 'react'
import { Loading } from '../../../components/loading'

function CreateContext (props) {
  const [contextName, setContextName] = useState('')

  return (
    <form>
      <div>
        <label htmlFor="name">{props.t('Add Sub-Context')}: </label>
        <input type="text" value={contextName} onChange={(e) => setContextName(e.target.value)} />
      </div>

      <button type="submit" disabled={props.disableButton || !contextName} onClick={(e) => props.callback(e, contextName, () => { setContextName('') })}>{props.loading ? <Loading /> : props.t('Add Context')}</button>
    </form>
  )
}
export default CreateContext
