import React from 'react'
import { Loading } from '../../../components/loading'

export function RemoveContext (props) {
  return (
    <div>
      <form>
        <button type="submit" disabled={props.disableButton} onClick={e => props.callback(e, props.selectedContext)}>{props.loading ? <Loading /> : props.t('Remove Context')}</button>
      </form>
    </div>
  )
}
export default RemoveContext
