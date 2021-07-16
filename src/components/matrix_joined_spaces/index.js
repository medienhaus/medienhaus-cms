import { useEffect, useState } from 'react'
import Matrix from '../../Matrix'

const getAnswer = async () => {
  const matrixClient = Matrix.getMatrixClient()

  // before fetching we check if our initial sync is completed
  console.log(matrixClient.isInitialSyncComplete())
  if (matrixClient.isInitialSyncComplete()) {
    const allRooms = matrixClient.getRooms()
    console.log(allRooms)
    const filteredRooms = allRooms.forEach(async room => {
      // we filter all joined rooms for spaces and within those spaces we already filter language spaces
      if (room.getType() !== 'm.space' || room.name === 'de' || room.name === 'en') return
      return {
        name: room.name
      }
      // const filter = room.timeline.filter(event => event.event.type === 'dev.medienhaus.meta')
      /*
      room.getAvatarUrl()
      room.getJoinRule()
      room.getJoinedMembers()
      room.members */
    })
    console.log(filteredRooms)
    try {
      // first we have to get all rooms a user has currently joined
      const answer = await matrixClient.getJoinedRooms()
      if (answer.joined_rooms.length > 0) {
        const getNames = await Promise.all(answer.joined_rooms.map(async (roomId) => {
          try {
            // now we need to find out which of these rooms are spaces
            const room = await matrixClient.getSpaceSummary(roomId)
            if (room.rooms[0].room_type !== 'm.space') return
            // and which one of these spaces has our medienhaus state event
            const meta = await matrixClient.getStateEvent(room.rooms[0].room_id, 'dev.medienhaus.meta')
            if (meta.type !== 'studentproject') return
            // then we check if the project is a collaboration
            const collab = room.rooms[0].num_joined_members > 1 ? await matrixClient.getJoinedRoomMembers(room.rooms[0].room_id) : false
            // and if the project is published or still a draft
            const joinRule = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room.rooms[0].room_id}/state/m.room.join_rules/`, {
              method: 'GET',
              headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') }
            })
            const published = await joinRule.json()
            // fetch introduction text
            // const introduction = room.rooms[1] ? await fetchIntroduction(room.rooms[1].room_id) : false
            return {
              name: room.rooms[0].name,
              room_id: room.rooms[0].room_id,
              published: published.join_rule,
              collab: collab && collab.joined,
              avatar_url: room.rooms[0].avatar_url !== undefined && room.rooms[0].avatar_url,
              description: room.rooms[0].topic,
              meta: meta
            }
          } catch (error) { }
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
}

const useJoinedSpaces = ({ reload }) => {
  const [joinedSpaces, setJoinedSpaces] = useState()
  const [fetchSpaces, setFetchSpaces] = useState(true)
  const [spacesErr, setSpacesErr] = useState(false)
  const [load, setLoad] = useState(reload)

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
