import React, { useEffect, useState } from 'react'
import { Loading } from '../loading'
import { Trans, useTranslation } from 'react-i18next'

const PublishProject = ({ disabled, space, published, description, time }) => {
  const { t } = useTranslation('projects')
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
      body: JSON.stringify({ join_rule: visibility })
    }
    try {
      await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${space.room_id}/state/m.room.join_rules/`, req)
        .then(response => {
          if (response.ok) {
            /* TODO: needs i18n */
            setUserFeedback('Changed successfully!')
            time && time()
            setTimeout(() => {
              setUserFeedback()
            }, 3000)
          } else {
            /* TODO: needs i18n */
            setUserFeedback('Oh no, something went wrong.')
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
    <>
      <select
        id="visibility" name="visibility" value={visibility} onChange={(e) => onChangeVisibility(e)} disabled={disabled}
      >
        <option value="invite">{t('Draft')}</option>
        <option value="public" disabled={!description || !context}>{t('Public')}</option>
      </select>
      <div className="below">
        {userFeedback && <p>{userFeedback}</p>}
        {!description && <p>❗{t('️Please add a short description of your project.')}</p>}
        {!context &&
          <p>
            <Trans t={t}>❗ Please add your project to a context. <em>This is not yet possible but will be shortly.</em></Trans>
          </p>}
      </div>
    </>
  )
}

export default PublishProject
