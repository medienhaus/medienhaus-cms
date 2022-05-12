import React from 'react'
import { Loading } from '../../../components/loading'
import { useTranslation } from 'react-i18next'

export function RemoveContext (props) {
  const { t } = useTranslation('admin')

  return (
    <div>
      <form>
        <button type="submit" disabled={props.disableButton} onClick={e => props.callback(e, props.parent, false)}>{props.loading ? <Loading /> : t('Remove Context')}</button>
      </form>
    </div>
  )
}

export default RemoveContext
