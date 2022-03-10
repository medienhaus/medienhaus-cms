import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'

const Invites = ({ space, callback }) => {
  const [reactingToInvite, setReactingToInvite] = useState(false)
  const [error, setError] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('invites')

  const join = async (room) => {
    setReactingToInvite(true)
    try {
      // first we join the project space in order to be able to call getSpaceSummary() nad check if the invite is for a module or a student project
      await matrixClient.joinRoom(room)
      const meta = await matrixClient.getStateEvent(room, 'dev.medienhaus.meta')
      if (meta?.type === 'content') {
        // if the project is a student project we map through each room in the projectspace and join it
        const space = await matrixClient.getRoomHierarchy(room).catch(console.log)
        space.rooms.forEach(async (space, index) => {
          console.log('joining ' + space.name)
          const subspaces = await matrixClient.getRoomHierarchy(space.room_id).catch(console.log)
          subspaces.rooms.forEach(async (space) => {
            await matrixClient.joinRoom(space.room_id).catch(console.log)
          })
          await matrixClient.joinRoom(space.room_id).catch(console.log)
        })
      }
      callback(room, false)
    } catch (err) {
      setError(err.errcode === 'M_UNKNOWN' ? 'Looks like this room does not exist anymore.' : 'Something went wrong.')

      setTimeout(() => {
        setError('')
        err?.errcode === 'M_UNKNOWN' && leave(room) // if the room was deleted we leave the room to clear it from our invites
      }, 2000)
    } finally {
      setReactingToInvite(false)
    }
  }

  const leave = async (room) => {
    setReactingToInvite(true)
    try {
      // first we join the project space in order to be able to call getSpaceSummary() nad check if the invite is for a module or a student project
      await matrixClient.leave(room)
      const meta = await matrixClient.getStateEvent(room, 'dev.medienhaus.meta')
      if (meta?.type === 'content') {
        // if the project is a student project we map through each room in the projectspace and join it
        const space = await matrixClient.getRoomHierarchy(room)
        space.rooms.forEach(async (space, index) => {
          console.log('leaving ' + space.name)
          const subspaces = await matrixClient.getRoomHierarchy(space.room_id).catch(console.log)
          subspaces.rooms.forEach(async (space) => {
            await matrixClient.leave(space.room_id).catch(console.log)
          })
          await matrixClient.leave(space.room_id).catch(console.log)
        })
      }
      callback(room, false)
    } catch (err) {
      setError(err.errcode === 'M_UNKNOWN' ? 'Looks like this room does not exist anymore.' : 'Something went wrong.')

      setTimeout(() => {
        setError('')
        err?.errcode === 'M_UNKNOWN' && callback(room, true)
      }, 2000)
    } finally {
      setReactingToInvite(false)
    }
  }

  return (
    <>
      <strong>{space.name}</strong>
      <div className="confirmation">
        <LoadingSpinnerButton className="cancel" disabled={reactingToInvite} onClick={() => leave(space.id)}>{t('REJECT')}</LoadingSpinnerButton>
        <LoadingSpinnerButton className="confirm" disabled={reactingToInvite} onClick={() => join(space.id)}>{t('ACCEPT')}</LoadingSpinnerButton>
      </div>
      {error}
    </>
  )
}

export default Invites
