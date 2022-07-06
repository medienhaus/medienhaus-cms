import _ from 'lodash'
import Matrix from '../../Matrix'

export const createStructurObject = async (roomId) => {
  async function getSpaceStructure (motherSpaceRoomId, includeRooms) {
    const result = {}

    function createSpaceObject (id, name, metaEvent, topic) {
      return {
        id: id,
        name: name,
        type: metaEvent.content.type,
        topic: topic,
        children: {}
      }
    }

    async function scanForAndAddSpaceChildren (spaceId, path) {
      if (spaceId === 'undefined') return
      const stateEvents = await Matrix.getMatrixClient().roomState(spaceId).catch(console.log)
      // check if room exists in roomHierarchy
      // const existsInCurrentTree = _.find(hierarchy, {room_id: spaceId})
      // const metaEvent = await matrixClient.getStateEvent(spaceId, 'dev.medienhaus.meta')
      const metaEvent = _.find(stateEvents, { type: 'dev.medienhaus.meta' })
      if (!metaEvent) return
      if (metaEvent.type === 'content') return
      // if (!typesOfSpaces.includes(metaEvent.content.type)) return

      const nameEvent = _.find(stateEvents, { type: 'm.room.name' })
      if (!nameEvent) return
      const spaceName = nameEvent.content.name
      let topic = _.find(stateEvents, { type: 'm.room.topic' })
      if (topic) topic = topic.content.topic
      // if (initial) {
      // result.push(createSpaceObject(spaceId, spaceName, metaEvent))
      _.set(result, [...path, spaceId], createSpaceObject(spaceId, spaceName, metaEvent, topic))
      // }

      // const spaceSummary = await matrixClient.getSpaceSummary(spaceId)
      console.log(`getting children for ${spaceId} / ${spaceName}`)
      for (const event of stateEvents) {
        if (event.type !== 'm.space.child' && !includeRooms) continue
        if (event.type === 'm.space.child' && _.size(event.content) === 0) continue // check to see if body of content is empty, therefore space has been removed
        if (event.room_id !== spaceId) continue

        await scanForAndAddSpaceChildren(event.state_key, [...path, spaceId, 'children'])
        // }
      }
    }

    await scanForAndAddSpaceChildren(motherSpaceRoomId, [])
    return result
  }

  console.log('---- started structure ----')
  const tree = await getSpaceStructure(roomId, false)
  return tree
}
