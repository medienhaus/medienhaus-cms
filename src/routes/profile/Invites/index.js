
import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const Invites = ({ room }) => {
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')
  const matrixClient = Matrix.getMatrixClient()

  const join = async (room) => {
    setJoining(true)
    try {
      //first we join the project space in order to be able to call getSpaceSummary()
      await matrixClient.joinRoom(room)
      //then we map through each room in the projectspace and join it
      await matrixClient.getSpaceSummary(room).then(res => {
        res.rooms.map(async contentRooms => contentRooms.room_id !== room && await matrixClient.joinRoom(contentRooms.room_id))
      })
    } catch (err) {
      setJoined(false)
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
        <li style={{ width: '100%' }}>{room.name}</li>
        <LoadingSpinnerButton disabled={joining || joined} onClick={() => join(room.id)}>ACCEPT</LoadingSpinnerButton>
      </div>
      {error}
    </>
  )
}
export default Invites
