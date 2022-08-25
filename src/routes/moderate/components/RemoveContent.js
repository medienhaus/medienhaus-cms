import React from 'react'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../../components/loading'
import UlElement from './UlElement'

const RemoveContent = ({ loading }) => {
  const { t } = useTranslation()

  return (
    <section className="delete">
      <h3>{t('Remove Content')}</h3>
      {loading
        ? <Loading />
        : <UlElement
            roomId={localStorage.getItem(process.env.REACT_APP_APP_NAME + '_root_context_space')}
            indent={0}
          />}
    </section>
  )
}
export default RemoveContent
