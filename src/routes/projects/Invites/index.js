import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'

const Invites = ({ space, callback }) => {
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('invites')

  const join = async (room) => {
    setJoining(true)
    try {
      // first we join the project space in order to be able to call getSpaceSummary() nad check if the invite is for a module or a student project
      await matrixClient.joinRoom(room)
      const meta = await matrixClient.getStateEvent(room, 'dev.medienhaus.meta')
      if (meta?.type === 'studentproject') {
        // if the project is a student project we map through each room in the projectspace and join it
        const space = await matrixClient.getSpaceSummary(room)
        space.rooms.forEach(async (space, index) => {
          console.log('joining ' + space.name)
          const subspaces = await matrixClient.getSpaceSummary(space.room_id).catch(console.log)
          subspaces.rooms.forEach(async (space) => {
            await matrixClient.joinRoom(space.room_id).catch(console.log)
          })
          await matrixClient.joinRoom(space.room_id).catch(console.log)
        })
      }
      callback(room)
    } catch (err) {
      setError(err.errcode === 'M_UNKNOWN' ? 'Looks like this room does not exist anymore.' : 'Something went wrong.')
      setTimeout(() => {
        setError('')
      }, 3000)
    } finally {
      setJoining(false)
    }
  }

  return (
    <>
      <strong>{space.name}</strong>
      <LoadingSpinnerButton disabled={joining} onClick={() => join(space.id)}>{t('ACCEPT')}</LoadingSpinnerButton>
      {error}
    </>
  )
}

export default Invites
