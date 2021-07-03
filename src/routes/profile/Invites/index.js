
import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const Invites = ({ room, callback }) => {
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const matrixClient = Matrix.getMatrixClient()

  const join = async (room) => {
    setJoining(true)
    try {
      //first we join the project space in order to be able to call getSpaceSummary() nad check if the invite is for a module or a student project
      await matrixClient.joinRoom(room)
      const studentProject = await matrixClient.getStateEvent(room, 'm.room.topic')
      if (studentProject.topic?.includes("studentproject")) {
        //if the project is a student project we map through each room in the projectspace and join it
        await matrixClient.getSpaceSummary(room).then(res => {
          res.rooms.map(async contentRooms => contentRooms.room_id !== room && await matrixClient.joinRoom(contentRooms.room_id))
        })
      }
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
      <div style={{ display: 'flex' }}>
        <span style={{ width: '100%' }}>{room.name}</span>
        <LoadingSpinnerButton disabled={joining} onClick={() => join(room.id)}>ACCEPT</LoadingSpinnerButton>
        {error}
      </div>
      {error}
    </>
  )
}
export default Invites
