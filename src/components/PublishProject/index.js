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
    if (published === 'invite') {
      // if 'published' = 'invite we know its legacy and we update it accordingly
      // onChangeVisibility('draft')
      metaEvent.published = 'draft'
      matrixClient.sendStateEvent(space.room_id, 'dev.medienhaus.meta', metaEvent)
      setVisibility('draft')
    } else if (published === 'public' && !metaEvent.published) {
      // if 'published' = 'public' but the meta event is missing, we know its legacy and we update it accordingly
      console.log('changing dev.medienhaus.meta...')
      metaEvent.published = published
      matrixClient.sendStateEvent(space.room_id, 'dev.medienhaus.meta', metaEvent)
      setVisibility('public')
    } else {
      setVisibility(published)
    }
  }, [matrixClient, metaEvent, published, space.room_id])

  const onChangeVisibility = async (e) => {
    setVisibility(e)

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
      body: JSON.stringify({ history_visibility: e === 'invite' ? 'shared' : 'world_readable' })
    }

    try {
      console.log('--- Starting to change visibility ---')
      for (const room of hierarchy.rooms) {
        // we do not want to change visibility for the parent space
        if (room.room_id !== space.room_id) {
          // const changeJoinRule = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room.room_id}/state/m.room.join_rules/`, joinRules)
          const changeHistoryVisibility = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room.room_id}/state/m.room.history_visibility/`, historyVisibility)

          if (changeHistoryVisibility.ok) {
            console.log('Changed ' + room.name + ' successfully!')
          } else {
            console.log('Oh no, something went wrong with room ' + room.name)
          }
        }
      }
      console.log('changing dev.medienhaus.meta...')
      metaEvent.published = e
      await matrixClient.sendStateEvent(space.room_id, 'dev.medienhaus.meta', metaEvent)
      console.log('--- All changed Succesfully to ' + e + ' ---')

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
        id="visibility" name="visibility" value={visibility} onChange={(e) => {
          if (space.topic && space.context) onChangeVisibility(e.target.value)
        }} disabled={disabled}
      >
        <option value="draft">{t('Draft')}</option>
        <option value="public" disabled={!space.topic || !space.context}>{t('Public')}</option>
      </select>
      {userFeedback && <p>{userFeedback}</p>}
    </div>
  )
}

export default PublishProject
