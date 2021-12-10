import React, { useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import ContextDropdown from '../../../components/ContextDropdownLive'
import * as _ from 'lodash'

const Category = ({ title, projectSpace, parent }) => {
  console.log(parent)
  // const [subject, setSubject] = useState('')
  // const [room, setRoom] = useState('')
  // const [member, setMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentContext, setCurrentContext] = useState(null)
  const [inputItems, setInputItems] = useState()
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    async function getCurrentContext () {
      const projectSpaceMetaEvent = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta')
      setCurrentContext(projectSpaceMetaEvent.context)
      setLoading(false)
    }

    getCurrentContext()
  }, [matrixClient, projectSpace])

  const createStructurObject = async () => {
    async function getSpaceStructure (motherSpaceRoomId, includeRooms) {
      const result = {}

      function createSpaceObject (id, name, metaEvent) {
        return {
          id: id,
          name: name,
          type: metaEvent.content.type,
          children: {}
        }
      }
      /*
      const typesOfSpaces = ['context',
        'class',
        'course',
        'institution',
        'degree program',
        'design department',
        'faculty',
        'institute',
        'semester']
*/
      async function scanForAndAddSpaceChildren (spaceId, path) {
        if (spaceId === 'undefined') return
        const stateEvents = await matrixClient.roomState(spaceId).catch(console.log)

        // check if room exists in roomHierarchy
        // const existsInCurrentTree = _.find(hierarchy, {room_id: spaceId})
        // const metaEvent = await matrixClient.getStateEvent(spaceId, 'dev.medienhaus.meta')
        const metaEvent = _.find(stateEvents, { type: 'dev.medienhaus.meta' })
        if (!metaEvent) return
        // if (!typesOfSpaces.includes(metaEvent.content.type)) return

        const nameEvent = _.find(stateEvents, { type: 'm.room.name' })
        if (!nameEvent) return
        const spaceName = nameEvent.content.name

        // if (initial) {
        // result.push(createSpaceObject(spaceId, spaceName, metaEvent))
        _.set(result, [...path, spaceId], createSpaceObject(spaceId, spaceName, metaEvent))
        // }

        // const spaceSummary = await matrixClient.getSpaceSummary(spaceId)
        console.log(`getting children for ${spaceId} / ${spaceName}`)
        for (const event of stateEvents) {
          if (event.type !== 'm.space.child' && !includeRooms) continue
          if (event.type === 'm.space.child' && _.size(event.content) === 0) continue // check to see if body of content is empty, therefore space has been removed
          if (event.room_id !== spaceId) continue
          // if (event.sender !== process.env.RUNDGANG_BOT_USERID && !includeRooms) continue

          // find deep where 'id' === event.room_id, and assign match to 'children'
          // const path = findPathDeep(result, (room, key) => {
          //   return room.id === event.room_id
          // }, {
          //   includeRoot: true,
          //   rootIsChildren: true,
          //   pathFormat: 'array',
          //   childrenPath: 'children'
          // })
          //
          // if (!path) continue

          // const metaEvent = await matrixClient.getStateEvent(event.state_key, 'dev.medienhaus.meta')

          // const childrenSpaceToAdd = createSpaceObject(event.state_key, spaceSummary, metaEvent)
          // if (!childrenSpaceToAdd.name) continue

          // _.set(result, [...path, 'children', event.state_key], childrenSpaceToAdd)

          // result[...path, 'children'].push(childrenSpaceToAdd)
          // const currentChildren = _.get(result, [...path, 'children'])
          // if (!currentChildren) {
          //   _.set(result, [...path, 'children'], [])
          //   currentChildren = _.get(result, [...path, 'children'])
          // }
          // console.log(currentChildren)
          // currentChildren.push(childrenSpaceToAdd)

          // Check if this is a space itself, and if so try to get its children
          // if (_.get(_.find(spaceSummary.rooms, ['room_id', event.state_key]), 'room_type') === 'm.space') {

          await scanForAndAddSpaceChildren(event.state_key, [...path, spaceId, 'children'])
          // }
        }
      }

      await scanForAndAddSpaceChildren(motherSpaceRoomId, [])

      return result
    }
    console.log('---- started structure ----')
    const tree = await getSpaceStructure(parent, false)
    console.log(tree[Object.keys(tree)[0]])
    setInputItems(tree)
  }

  useEffect(() => {
    createStructurObject()
    // eslint-disable-next-line
  }, [])

  // const isMember = async (e) => {
  //   e.preventDefault()
  //   setLoading(true)
  //   setMember(true)
  //   setSubject(e.target.value)
  //   setRoom(JSON.parse(e.target.value))
  //   try {
  //     await matrixClient.members(room.space + localStorage.getItem('mx_home_server')).catch(err => console.error(err)).then(res => {
  //       setMember(res.chunk.map(a => a.sender).includes(localStorage.getItem('mx_user_id')))
  //     })
  //     console.log(member)
  //   } catch (err) {
  //     console.error(err)
  //     setMember(false)
  //   }
  //
  //   setLoading(false)
  // }
  // const callback = (requested) => {
  //   setSubject('')
  // }

  async function onContextChosen (contextSpaceId) {
    let projectSpaceMetaEvent = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta')

    setLoading(true)

    if (projectSpaceMetaEvent.context && projectSpaceMetaEvent.context !== contextSpaceId) {
      // If this project was in a different context previously we should try to take it out of the old context
      const req = {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
        body: JSON.stringify({})
      }
      await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpaceMetaEvent.context}/state/m.space.child/${projectSpace}`, req)
    }

    // Add this current project to the given context space
    const req = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({
        auto_join: false,
        suggested: false,
        via: [process.env.REACT_APP_MATRIX_BASE_URL.replace('https://', '')]
      })
    }
    await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${contextSpaceId}/state/m.space.child/${projectSpace}`, req)

    // Set the new context in our meta event
    projectSpaceMetaEvent.context = contextSpaceId
    await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.meta', projectSpaceMetaEvent)

    // Get the freshly updated state event and save it in our state
    projectSpaceMetaEvent = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta')
    setCurrentContext(projectSpaceMetaEvent.context)
    setLoading(false)
  }

  return (
    <>
      {/* }
      <p>{t('In which context do you want to publish your project?')}</p>
      <p>{t('This information is necessary to show your project in the right place on the Rundgang 2021 website, and must therefore be specified when you change the visibility of the project to public.')}</p>
      <p>{t('The context can be a class, a course, a seminar or a free project. If you are unsure, ask the professor of your class or the seminar leader.')}</p>
      <p>{t('You can scroll through the list, or filter/search the list by typing one or more keywords.')}</p>
  */}
      <div style={{ position: 'relative' }}>
        {loading || !inputItems
          ? <Loading />
          : <ContextDropdown
              onItemChosen={onContextChosen}
              selectedContext={currentContext}
              showRequestButton
              struktur={inputItems}
              matrixClient={matrixClient}
            />}
      </div>
      {/* {subject !== '' && !member && <Knock room={room} callback={callback} />} */}
    </>
  )
}
export default Category
