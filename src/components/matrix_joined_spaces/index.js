import { useEffect, useState } from 'react'
import Matrix from '../../Matrix'

const isJson = (str) => {
  /* Checking to see if topic contains a json. should be enough since students probably won't store jsons in their topics.
  But can be changed to check for specifix keys if needed obvs */
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

const getAnswer = async () => {
  const matrixClient = Matrix.getMatrixClient()

  try {
    const answer = await matrixClient.getJoinedRooms()
    
    if (answer.joined_rooms.length > 0) {
      const getNames = await Promise.all(answer.joined_rooms.map(async (roomId) => {
        try {
          const room = await matrixClient.getSpaceSummary(roomId)
          // console.log(room.rooms[0].room_type
          if (room.rooms[0].room_type === 'm.space' && isJson(room.rooms[0].topic)) {
            const collab = room.rooms[0].num_joined_members > 1 ? await matrixClient.getJoinedRoomMembers(room.rooms[0].room_id) : false
            return { name: room.rooms[0].name, room_id: room.rooms[0].room_id, topic: JSON.parse(room.rooms[0].topic), collab: collab && collab.joined  }
          } else {
            return false
          }
        } catch (error) {
          console.log(error)
        }
      }
      )
      )
      return getNames.filter(Boolean)
    } else {
     return false
    }
  } catch (e) {
    console.log(e)
  }
}

const useJoinedSpaces = () => {
  const [joinedSpaces, setJoinedSpaces] = useState()
  const [fetchSpaces, setFetchSpaces] = useState(true)
  const [spacesErr, setSpacesErr] = useState(false)

  useEffect(() => {
    let canceled
    setFetchSpaces(true);
    (async () => {
      try {
        const res = await getAnswer()
        canceled || setJoinedSpaces(res)
      } catch (err) {
        canceled || setSpacesErr(err)
      } finally {
        canceled || setFetchSpaces(false)
      }
    })()
    return () => { canceled = true }
    
    // eslint-disable-next-line
  }, []);
  return {
    joinedSpaces,
    spacesErr,
    fetchSpaces
  }
}

export default useJoinedSpaces
