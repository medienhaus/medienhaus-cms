
import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const Invites = ({ room, index, callback }) => {
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const matrixClient = Matrix.getMatrixClient()

  const join = async (room) => {
    setJoining(true)
    try {
      await matrixClient.joinRoom(room).then(console.log).then(callback(index))
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
        <li style={{ width: '100%' }}>{room.name}</li>
        <LoadingSpinnerButton disabled={joining} onClick={() => join(room.id)}>ACCEPT</LoadingSpinnerButton>
      </div>
      {error}
    </>
  )
}
export default Invites
