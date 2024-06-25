import * as _ from 'lodash'
import Matrix from '../Matrix'

export const createMatrixStructureObject = async (parentId, projectSpace, setContexts) => {
  const matrixClient = Matrix.getMatrixClient()
  async function getSpaceStructure (motherSpaceRoomId, includeRooms) {
    const result = {} // the resulting tree structure
    let hasContext = false // we use a boolean to know if a content is in a context which we need for the publishProject component in /create

    function createSpaceObject (id, name, metaEvent, joinRule, membership, topic) {
      return {
        id,
        name,
        type: metaEvent.content.type,
        joinRule: joinRule,
        membership: membership,
        topic: topic,
        children: {}
      }
    }

    async function scanForAndAddSpaceChildren (spaceId, path) {
      if (spaceId === 'undefined') return
      const stateEvents = await matrixClient.roomState(spaceId).catch(console.log)

      const metaEvent = _.find(stateEvents, { type: 'dev.medienhaus.meta' })
      if (!metaEvent) return
      // make sure we only show contexts
      if (_.get(metaEvent, 'content.type') !== 'context') return
      // make sure we have a name for the context
      const nameEvent = _.find(stateEvents, { type: 'm.room.name' })
      if (!nameEvent) return
      const spaceName = nameEvent.content.name
      // get the topic for the context
      let topic = _.find(stateEvents, { type: 'm.room.topic' })
      if (topic) topic = topic.content.topic

      // check the join rule of the context
      const joinRule = _.find(stateEvents, { type: 'm.room.join_rules' })?.content?.join_rule
      // find the membership of the user in the context by checking the m.room.members event and its state_key which is the user_id
      const memberEvent = _.find(stateEvents, { type: 'm.room.member', state_key: matrixClient.getUserId() })

      _.set(result, [...path, spaceId], createSpaceObject(spaceId, spaceName, metaEvent, joinRule, memberEvent?.content?.membership, topic))

      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') console.log(`getting children for ${spaceId} / ${spaceName}`)
      for (const event of stateEvents) {
        if (event.type !== 'm.space.child' && !includeRooms) continue
        if (event.type === 'm.space.child' && _.size(event.content) === 0) continue // check to see if body of content is empty, therefore space has been removed
        if (setContexts && event.state_key === projectSpace) {
          setContexts(contexts => {
            if (contexts) return [...contexts, { name: spaceName, room_id: event.room_id }]
            else return [{ name: spaceName, room_id: event.room_id }]
          }) // add context to the contexts array if the projectspace is a child of it
          hasContext = true
        }
        if (event.room_id !== spaceId) continue

        await scanForAndAddSpaceChildren(event.state_key, [...path, spaceId, 'children'])
      }
    }

    await scanForAndAddSpaceChildren(motherSpaceRoomId, [])

    // if (_.isEmpty(result)) setContexts([]) // if the content is in not in any context, yet, we set contexts to an empty array in order to display the publishProject component
    return [result, hasContext]
  }
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') console.log('---- started structure ----')
  const tree = await getSpaceStructure(parentId, false)
  if (setContexts && !tree[1]) setContexts([]) // if the content is in not in any context, yet, we set contexts to an empty array in order to display the publishProject component
  // setInputItems(tree[0][parent])

  return tree
}
