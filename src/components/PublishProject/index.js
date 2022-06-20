import React, { useEffect, useState } from 'react'
import { Loading } from '../loading'
import { useTranslation } from 'react-i18next'
import Matrix from '../../Matrix'

const PublishProject = ({ disabled, space, published, hasContext, metaEvent }) => {
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
      console.info('changing dev.medienhaus.meta...')
      metaEvent.published = published
      matrixClient.sendStateEvent(space.room_id, 'dev.medienhaus.meta', metaEvent)
      setVisibility('public')
    } else {
      setVisibility(published)
    }
  }, [matrixClient, metaEvent, published, space.room_id])

  const onChangeVisibility = async (publishState) => {
    setVisibility(publishState)
    const hierarchy = await matrixClient.getRoomHierarchy(space.room_id, 50, 1)
    const joinRules = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({ join_rule: publishState === 'public' ? 'public' : 'invite' })
    }
    const historyVisibility = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({ history_visibility: publishState === 'invite' ? 'shared' : 'world_readable' })
    }
    try {
      console.log('--- Starting to change visibility ---')
      for (const room of hierarchy.rooms) {
        const changeJoinRule = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room.room_id}/state/m.room.join_rules/`, joinRules)
        if (changeJoinRule.ok) console.log('Changed joinRule of ' + room.name + ' successfully to ' + publishState + '!')
        else console.log('Oh no, changing join_rule went wrong with room ' + room.name)

        const changeHistoryVisibility = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room.room_id}/state/m.room.history_visibility/`, historyVisibility)
        if (changeHistoryVisibility.ok) console.log('Changed history_visibility of ' + room.name + ' successfully!')
        else console.log('Oh no, something went wrong with room ' + room.name)
      }

      console.log('changing dev.medienhaus.meta...')
      metaEvent.published = publishState
      await matrixClient.sendStateEvent(space.room_id, 'dev.medienhaus.meta', metaEvent)
      console.log('--- All changed Succesfully to ' + publishState + ' ---')

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
          if (space.topic && hasContext) onChangeVisibility(e.target.value)
        }} disabled={disabled}
      >
        <option value="draft">{t('Draft')}</option>
        <option value="public" disabled={!space.topic || !hasContext}>{t('Public')}</option>
      </select>
      {userFeedback && <p>{userFeedback}</p>}
    </div>
  )
}

export default PublishProject
