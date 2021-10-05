import React, { useEffect, useState } from 'react'
import { Loading } from '../loading'
import { useTranslation } from 'react-i18next'
import Matrix from '../../Matrix'

const PublishProject = ({ disabled, space, published, time, metaEvent }) => {
  const { t } = useTranslation('publish')
  // eslint-disable-next-line no-unused-vars
  const [userFeedback, setUserFeedback] = useState()
  const [visibility, setVisibility] = useState(published)
  const matrixClient = Matrix.getMatrixClient()
  useEffect(() => {
    setVisibility(published)
  }, [published])

  const onChangeVisibility = async (e) => {
    setVisibility(e.target.value)

    const hierarchy = await matrixClient.getRoomHierarchy(space.room_id, 50, 1)
    console.log(hierarchy)
    /*
    const joinRules = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({ join_rule: e.target.value })
    }
    */

    const historyVisibility = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({ history_visibility: e.target.value === 'invite' ? 'shared' : 'world_readable' })
    }

    try {
      for (const room of hierarchy.rooms) {
        // we do not want to change visibility for the parent space
        if (room.room_id !== space.room_id) {
          console.log('--- Starting to change visibility ---')
          // const changeJoinRule = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room.room_id}/state/m.room.join_rules/`, joinRules)
          const changeHistoryVisibility = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room.room_id}/state/m.room.history_visibility/`, historyVisibility)

          if (changeHistoryVisibility.ok) {
            console.log('Changed ' + room.name + ' successfully!')
          } else {
            console.log('Oh no, something went wrong with room ' + room.name)
          }
        }
      }
      console.log('--- All changed Succesfully to ' + e.target.value + ' ---')
      setUserFeedback(t('Changed successfully!'))
      setTimeout(() => setUserFeedback(''), 3000)
    } catch (err) {
      console.error(err)
      setUserFeedback(t('Oh no, something went wrong.'))
      setTimeout(() => setUserFeedback(''), 3000)
    }
  }

  if (!visibility) return <Loading />

  return (
    <div className="below">
      <select
        id="visibility" name="visibility" value={visibility} onChange={(e) => onChangeVisibility(e)} disabled={disabled}
      >
        <option value="invite">{t('Draft')}</option>
        <option value="public" disabled={!space.topic || !metaEvent.context}>{t('Public')}</option>
      </select>
      {userFeedback && <p>{userFeedback}</p>}
    </div>
  )
}

export default PublishProject
