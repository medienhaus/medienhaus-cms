import { useEffect, useState } from 'react'
import Matrix from '../../Matrix'

const isJson = (str) => {
  /* Checking to see if topic contains a json. should be enough since students probably won't store jsons in their topics.
  But can be changed to check for specific keys if needed obvs */
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}
const fetchIntroduction = async (room) => {
  const introductionRoom = process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room}/messages?limit=1&dir=b`
  const introduction = await fetch(introductionRoom, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') }
  })
  const introductionText = await introduction.json()
  return introductionText.chunk[0].content.body
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
            const collab = room.rooms[0].num_joined_members > 2 ? await matrixClient.getJoinedRoomMembers(room.rooms[0].room_id) : false
            const joinRule = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room.rooms[0].room_id}/state/m.room.join_rules/`, {
              method: 'GET',
              headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') }
            })
            const published = await joinRule.json()
            // fetch introduction text
            const introduction = room.rooms[1] ? await fetchIntroduction(room.rooms[1].room_id) : false
            return {
              name: room.rooms[0].name,
              room_id: room.rooms[0].room_id,
              description: introduction,
              topic: JSON.parse(room.rooms[0].topic),
              published: published.join_rule,
              collab: collab && collab.joined,
              avatar_url: room.rooms[0].avatar_url !== undefined && room.rooms[0].avatar_url
            }
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

const useJoinedSpaces = ({ num }) => {
  const [joinedSpaces, setJoinedSpaces] = useState()
  const [fetchSpaces, setFetchSpaces] = useState(true)
  const [spacesErr, setSpacesErr] = useState(false)
  const [load, setLoad] = useState(false)

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
  }, [load]);
  return {
    joinedSpaces,
    spacesErr,
    fetchSpaces,
    reload: () => {
      setLoad({ ...load }
      )
    }
  }
}

export default useJoinedSpaces
