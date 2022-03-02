import { useEffect, useState } from 'react'
import Matrix from '../../Matrix'
import config from '../../config.json'

const matrixClient = Matrix.getMatrixClient()
const context = config.medienhaus?.context ? config.medienhaus?.context.concat('context') : 'context'
const content = Object.keys(config.medienhaus?.content) ? Object.keys(config.medienhaus?.content).concat('content') : 'content'
const typesOfContent = context.concat(content)
// @TODO change hook to also return invites and knocks

const getAnswer = async () => {
  const visibleRooms = matrixClient.getVisibleRooms()
  const filteredRooms = visibleRooms
  // we filter all joined rooms for spaces
    .filter(room => room.isSpaceRoom() &&
      room.name !== 'de' && // and within those spaces we filter all language and event spaces.
      room.name !== 'en' &&
      room.name !== 'events' &&
      room.getMyMembership() === 'join' && // we only want spaces a user is part of
      room.currentState.events.has('dev.medienhaus.meta') && // check if the room has our meta event
      typesOfContent.includes(room.currentState.events.get('dev.medienhaus.meta').values().next().value.event.content.type) // and see if the type is listed in our content config
    )
    .map(room => {
      const collab = room.getJoinedMemberCount() > 1
      const event = room.currentState.events.get('dev.medienhaus.meta').values().next().value.event.content
      const topic = room.currentState.events.has('m.room.topic') ? room.currentState.events.get('m.room.topic').values().next().value.event.content.topic : undefined
      const powerLevel = room.currentState.members[localStorage.getItem('mx_user_id')].powerLevel
      // have not found an easier way to grab the events from the room object
      return {
        name: room.name,
        room_id: room.roomId,
        published: event?.published || room.getJoinRule(),
        collab: collab,
        avatar_url: room.getMxcAvatarUrl(),
        meta: event,
        topic: topic,
        membership: room.getMyMembership(),
        powerLevel: powerLevel
      }
    })
  return filteredRooms
}

const useJoinedSpaces = ({ reload }) => {
  const [joinedSpaces, setJoinedSpaces] = useState(reload)
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
