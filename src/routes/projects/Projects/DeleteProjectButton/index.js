import React, { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Loading } from '../../../../components/loading'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'
import Matrix from '../../../../Matrix'

const DeleteProjectButton = ({ roomId, name, index, toggleDeleteButton, reloadProjects }) => {
  const [warning, setWarning] = useState(false)
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

  const deleteProject = async (e) => {
    e.preventDefault()
    let space
    try {
      space = await matrixClient.getSpaceSummary(roomId)
    } catch (err) {
      console.error(err)
    }
    space.rooms.reverse().map(async (space, index) => {
      // we reverse here to leave the actual project space last in case something goes wrong in the process.
      console.log('Leaving ' + space.name)
      if (index < space.rooms.length) {
        const subspaces = await matrixClient.getSpaceSummary(space.roomId)
        subspaces.rooms.reverse().map(async (space) => {
          const count = await matrixClient.getJoinedRoomMembers(space.room_id)
          Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
            localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(space.room_id, name)
          })
        })
      }
      try {
        const count = await matrixClient.getJoinedRoomMembers(space.room_id)
        Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
          localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(space.room_id, name)
        })
        await matrixClient.leave(space.room_id)
      } catch (err) {
        console.error(err)
      }
    })
    return 'successfully deleted ' + roomId
  }

  return (
        <>
            {leaving && <Loading />}
            <p>
                <Trans t={t} i18nKey="deleteConfirmation">Are you sure you want to delete the project <strong>{{ name }}</strong>?
                    This cannot be undone and will delete the project for you and any collaborator(s) that might be part of it.
                </Trans>
            </p>
            <button onClick={() => toggleDeleteButton()}>{t('CANCEL')}</button>
            <LoadingSpinnerButton
                disabled={leaving}
                onClick={async () => {
                  if (warning) {
                    setLeaving(true)
                    await deleteProject(null, roomId)
                      .then(() => reloadProjects(index))
                      .catch(err => console.log(err))
                      .finally(() => {
                        if (isMounted.current) {
                          setLeaving(false)
                        }
                      })
                    setWarning(false)
                  } else {
                    setWarning(true)
                  }
                }} >{warning ? t('Yes, delete project') : t('DELETE')}</LoadingSpinnerButton>

        </>
  )
}
export default DeleteProjectButton
