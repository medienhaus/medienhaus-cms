import React, { useState } from 'react'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'
import UlElement from './UlElement'

const RemoveContent = ({ fetching }) => {
  const [selectedRoom, setSelectedRoom] = useState('')
  const [feedback, setFeedback] = useState('')
  const { t } = useTranslation()

  const deleteContent = (props) => {
    setFeedback('removed content')
    setTimeout(() => {
      setFeedback('')
      setSelectedRoom('')
    }, 2500)
  }

  return (
    <section className="delete">
      <h3>{t('Delete Content')}</h3>
      <UlElement roomId={process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID} indent={0} setSelectedRoom={setSelectedRoom} />
      <LoadingSpinnerButton disabled={fetching || feedback || !selectedRoom} onClick={deleteContent}>{t('Delete selected content')}</LoadingSpinnerButton>
      {feedback &&
        <p>{feedback}</p>}
    </section>
  )
}
export default RemoveContent
