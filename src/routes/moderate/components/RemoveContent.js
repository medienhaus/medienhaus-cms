import React, { useState } from 'react'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'
import UlElement from './UlElement'

const RemoveContent = ({ fetching }) => {
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedParent, setSelectedParent] = useState(process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID)
  const [feedback, setFeedback] = useState('')
  const { t } = useTranslation()

  const deleteContent = async () => {
    await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${selectedParent}/state/m.space.child/${selectedRoom}`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({ }) // if we add a space to an existing one we need to send the object 'body', to remove a space we send an empty object.
    }).catch(console.log)

    setFeedback('removed content successfully')
    setTimeout(() => {
      setFeedback('')
      setSelectedRoom('')
      setSelectedParent('')
    }, 2500)
  }

  const removeContentElement = (content, parent, callback) => {
    setSelectedRoom(content)
    parent && setSelectedParent(parent)
    if (callback) return callback()
  }

  return (
    <section className="delete">
      <h3>{t('Delete Content')}</h3>
      <UlElement
        roomId={process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID}
        indent={0}
        removeContentElement={removeContentElement}
      />
      <LoadingSpinnerButton
        disabled={fetching || feedback || !selectedRoom}
        onClick={deleteContent}
      >{t('Remove selected content')}
      </LoadingSpinnerButton>
      {feedback &&
        <p>{feedback}</p>}
    </section>
  )
}
export default RemoveContent
