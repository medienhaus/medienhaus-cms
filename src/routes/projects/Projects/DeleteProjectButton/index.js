import React, { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Loading } from '../../../../components/loading'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'
import Matrix from '../../../../Matrix'

const DeleteProjectButton = ({ roomId, name, index, toggleDeleteButton, removeProject }) => {
  const [leaving, setLeaving] = useState(false)
  const isMounted = useRef(true)
  const matrixClient = Matrix.getMatrixClient()

  const { t } = useTranslation('projects')

  useEffect(() => {
    // needed to add this cleanup useEffect to prevent memory leaks
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const deleteProject = async () => {
    let log
    try {
      // we change the meta json to reflect the deleted space
      await matrixClient.sendStateEvent(roomId, 'm.medienhaus.meta', { deleted: true })
      const space = await matrixClient.getSpaceSummary(roomId).catch(console.log)
      console.log(space.rooms)
      space.rooms.filter(room => room.room_id !== roomId).forEach(async (space, index) => {
        // we reverse here to leave the actual project space last in case something goes wrong in the process.
        console.log('Leaving ' + space.name)
        const subspaces = await matrixClient.getSpaceSummary(space.room_id).catch(console.log)
        subspaces.rooms.reverse().forEach(async (space) => {
          const count = await matrixClient.getJoinedRoomMembers(space.room_id)
          Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
            localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(space.room_id, name).catch(console.log)
          })
          await matrixClient.leave(space.room_id).catch(console.log)
        })
        const count = await matrixClient.getJoinedRoomMembers(space.room_id)
        Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(async name => {
          localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(space.room_id, name).catch(console.log)
        })
        await matrixClient.leave(space.room_id).catch(console.log)
      })
      await matrixClient.leave(roomId).catch(console.log)
      log = 'successfully deleted ' + roomId
    } catch (err) {
      log = err
    }
    return log
  }

  return (
    <>
      {leaving && <Loading />}
      <p>
        <Trans t={t} i18nKey="deleteConfirmation">Are you sure you want to delete the project <strong>{{ name }}</strong>?
          This cannot be undone and will delete the project for you and any collaborator(s) that might be part of it.
        </Trans>
      </p>
      <div className="savecancel">
        <button className="cancel" onClick={() => toggleDeleteButton()}>{t('CANCEL')}</button>
        <LoadingSpinnerButton
          className="confirm"
          disabled={leaving}
          onClick={async () => {
            setLeaving(true)
            await deleteProject(roomId)
              .then(() => removeProject(index))
              .then(() => toggleDeleteButton())
              .catch(err => console.log(err))
              .finally(() => {
                if (isMounted.current) {
                  setLeaving(false)
                }
              })
          }}
        >{t('DELETE')}
        </LoadingSpinnerButton>
      </div>
    </>
  )
}

export default DeleteProjectButton
