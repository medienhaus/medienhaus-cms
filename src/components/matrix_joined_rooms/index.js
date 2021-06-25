import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../Matrix'

const useJoinedRooms = () => {
  const [answer, setAnswer] = useState([])
  const history = useHistory()
  const matrixClient = Matrix.getMatrixClient()

  const getAnswer = async () => {
    try {
      const answer = await matrixClient.getJoinedRooms()
      if (answer.joined_rooms.length > 0) {
        const getNames = await Promise.all(answer.joined_rooms.map(async (roomId) => {
          try {
            const room = await matrixClient.getStateEvent(roomId, 'm.room.topic')
            if (room.topic) {
            const name = await matrixClient.getStateEvent(roomId, 'm.room.name')
              return {name: name.name, topic: room.topic, room_id: roomId}
            } else {
              return ''
            }
          } catch (error) {
            if (error.data.error === 'Unrecognised access token') {
              alert('Oops something went wrong! Please try loggin in again')
              localStorage.clear()
              return history.push('/login')
            } else if (error.data.error === 'Invalid macaroon passed.') {
              alert('Oops something went wrong! Please try loggin in again')
              localStorage.clear()
              return history.push('/login')
            }
            return ''
          }
        }
        )
        )
        setAnswer(getNames)
      } else {
        setAnswer(['You are currently not part of any rooms'])
      }
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    getAnswer()
    // eslint-disable-next-line
  }, []);

  return answer
}

export default useJoinedRooms
