import React, { useEffect, useState } from 'react'
import { Loading } from '../loading'
import { useTranslation } from 'react-i18next'

const PublishProject = ({ disabled, space, published, time }) => {
  const { t } = useTranslation('publish')
  const [userFeedback, setUserFeedback] = useState()
  const [visibility, setVisibility] = useState(published)
  const context = false

  useEffect(() => {
    setVisibility(published)
  }, [published])

  const onChangeVisibility = async (e) => {
    setVisibility(e.target.value)
    const req = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({ join_rule: e.target.value })
    }
    try {
      await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${space.room_id}/state/m.room.join_rules/`, req)
        .then(response => {
          if (response.ok) {
            setUserFeedback(t('Changed successfully!'))
            time && time()
            setTimeout(() => {
              setUserFeedback()
            }, 3000)
          } else {
            setUserFeedback(t('Oh no, something went wrong.'))
            setTimeout(() => {
              setUserFeedback()
            }, 3000)
          }
        })
    } catch (err) {
      console.error(err)
    }
  }

  if (!visibility) return <Loading />

  return (
    <div className="below">
      <select
        id="visibility" name="visibility" value={visibility} onChange={(e) => onChangeVisibility(e)} disabled={disabled}
      >
        <option value="invite">{t('Draft')}</option>
        <option value="public" disabled={!space.description || !context}>{t('Public')}</option>
      </select>
      {userFeedback && <p>{userFeedback}</p>}
    </div>
  )
}

export default PublishProject
