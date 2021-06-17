  
import React, { useState } from 'react'
import Matrix from '../../../Matrix'

const Invites = ({room}) => {
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState('');
    const matrixClient = Matrix.getMatrixClient()

    const join = async (e, room) => {
        e.preventDefault()
        setJoining(true)
        try {
            await matrixClient.joinRoom(room).then(console.log).then(setJoined(true))
        } catch (err) {
            setJoined(false)
            setError(err.errcode === "M_UNKNOWN" ? 'Looks like this room does not exist anymore.' : 'Something went wrong.')
            setTimeout(() => {
                setError('')
            },3000)
        } finally {
            setJoining(false)
        }
    }
     return (
              <div>
              <li>{room.name}</li>
             <button disabled={joining || joined} onClick={(e) => join(e, room.id)}>ACCEPT</button>
             {error}
                </div>
            )
         
  }
  export default Invites