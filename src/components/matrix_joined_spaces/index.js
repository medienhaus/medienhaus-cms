import { useEffect, useState } from 'react'
import Matrix from '../../Matrix'

const useJoinedSpaces = () => {
  const [answer, setAnswer] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  const isJson = (str) => {
    /* Checking to see if topic contains a json. should be enough since students probably won't store jsons in their topics.
    But can be changed to check for specifix keys if needed obvs */
    try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
  }

  const getAnswer = async () => {
    try {
      const answer = await matrixClient.getJoinedRooms()
      if (answer.joined_rooms.length > 0) {
        const getNames = await Promise.all(answer.joined_rooms.map(async (roomId) => {
          try {
            const room = await matrixClient.getSpaceSummary(roomId)
            //console.log(room.rooms[0].room_type
            if (room.rooms[0].room_type === 'm.space' && isJson(room.rooms[0].topic)) {
              return {"name": room.rooms[0].name, "room_id": room.rooms[0].room_id, "topic": JSON.parse(room.rooms[0].topic)}
            } else {
              return false
            }
          } catch (error) {
           console.log(error)
          }
        }
        )
        )
        setAnswer(getNames.filter(Boolean))
      } else {
        setAnswer(false)
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

export default useJoinedSpaces
