import React from 'react'
import { useTranslation } from 'react-i18next'
import UlElement from './UlElement'

const RemoveContent = ({ fetching }) => {
  const { t } = useTranslation()

  return (
    <section className="delete">
      <h3>{t('Delete Content')}</h3>
      <UlElement
        roomId={process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID}
        indent={0}
      />
    </section>
  )
}
export default RemoveContent
