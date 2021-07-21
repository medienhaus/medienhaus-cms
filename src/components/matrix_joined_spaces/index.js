import { useEffect, useState } from 'react'
import Matrix from '../../Matrix'
const matrixClient = Matrix.getMatrixClient()
// @TODO change hook to also return invites and knocks

const getAnswer = async () => {
  const allRooms = matrixClient.getRooms()
  console.log(allRooms)
  const filteredRooms = allRooms
  // we filter all joined rooms for spaces
    .filter(room => room.getType() === 'm.space' &&
      room.name !== 'de' && // and within those spaces we filter all language spaces.
      room.name !== 'en' &&
      room.getMyMembership() === 'join' && // we only want spaces a user is part of
      room.timeline.some(event => event.event.type === 'dev.medienhaus.meta')) // Last step is to filter any spaces which were not created with  the cms, therefore will not have the medienhaus state event
    .map(room => {
      const collab = room.getJoinedMemberCount() > 1
      const event = room.timeline.filter(event => event.event.type === 'dev.medienhaus.meta')
      const topic = room.timeline.filter(event => event.event.type === 'm.room.topic')
      return {
        name: room.name,
        room_id: room.roomId,
        published: room.getJoinRule(),
        collab: collab,
        avatar_url: room.getMxcAvatarUrl(),
        meta: event[event.length - 1].event.content,
        description: topic[topic.length - 1]?.event.content.topic
      }
    })
  return filteredRooms
}

const useJoinedSpaces = ({ reload }) => {
  const [joinedSpaces, setJoinedSpaces] = useState()
  const [fetchSpaces, setFetchSpaces] = useState(true)
  const [spacesErr, setSpacesErr] = useState(false)
  const [load, setLoad] = useState(reload)

  useEffect(() => {
    let canceled
    setFetchSpaces(true)
    const fetchSpaces = async () => {
      if (matrixClient.isInitialSyncComplete()) {
        try {
          const res = await getAnswer()
          canceled || setJoinedSpaces(res)
        } catch (err) {
          canceled || setSpacesErr(err)
        } finally {
          canceled || setFetchSpaces(false)
        }
      } else {
        setTimeout(() => {
          fetchSpaces()
        }, 200)
      }
    }
    fetchSpaces()
    return () => { canceled = true }
  }, [load])

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
