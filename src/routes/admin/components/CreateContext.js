import React from 'react'
import { Loading } from '../../../components/loading'

function CreateContext (props) {
  return (
    <form>
      <div>
        <label htmlFor="name">{props.t('Add Context')}: </label>
        <input type="text" onChange={(e) => props.setNewContext(e.target.value)} />
      </div>

      <button type="submit" disabled={props.disableButton} onClick={(e) => props.callback(e)}>{props.loading ? <Loading /> : props.t('Add Context')}</button>
    </form>
  )
}
export default CreateContext
