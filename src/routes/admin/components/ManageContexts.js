import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateContext from './CreateContext'
import { RemoveContext } from './RemoveContext'
import { ShowContexts } from './ShowContexts'
import * as _ from 'lodash'
import { Loading } from '../../../components/loading'
import ProjectImage from '../../create/ProjectImage'
import AddLocation from '../../create/AddContent/AddLocation'

const ManageContexts = (props) => {
  const { t } = useTranslation('admin')
  const [selectedContext, setSelectedContext] = useState('!EyRTeozehwfsYePWMl:dev.medienhaus.udk-berlin.de')
  const [structure, setStructure] = useState(null)
  const [newContext, setNewContext] = useState('')
  const [parentName] = useState('Stechlin')
  // eslint-disable-next-line no-unused-vars
  const [disableButton, setDisableButton] = useState(false)
  const [parent] = useState('!ZbMmIxgnJIhuROlgKJ:dev.medienhaus.udk-berlin.de')

  const createStructurObject = async () => {
    async function getSpaceStructure (matrixClient, motherSpaceRoomId, includeRooms, hierarchy) {
      const result = {}

      function createSpaceObject (id, name, metaEvent) {
        return {
          id: id,
          name: name,
          type: metaEvent.content.type,
          children: {}
        }
      }

      const typesOfSpaces = ['context',
        'class',
        'course',
        'institution',
        'degree program',
        'design department',
        'faculty',
        'institute',
        'semester']

      async function scanForAndAddSpaceChildren (spaceId, path) {
        if (spaceId === 'undefined') return
        const stateEvents = await matrixClient.roomState(spaceId).catch(console.log)

        // check if room exists in roomHierarchy
        // const existsInCurrentTree = _.find(hierarchy, {room_id: spaceId})
        // const metaEvent = await matrixClient.getStateEvent(spaceId, 'dev.medienhaus.meta')
        const metaEvent = _.find(stateEvents, { type: 'dev.medienhaus.meta' })
        if (!metaEvent) return
        if (!typesOfSpaces.includes(metaEvent.content.type)) return

        const nameEvent = _.find(stateEvents, { type: 'm.room.name' })
        if (!nameEvent) return
        const spaceName = nameEvent.content.name

        // if (initial) {
        _.set(result, [...path, spaceId], createSpaceObject(spaceId, spaceName, metaEvent, stateEvents))
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
    const hierarchy = await props.matrixClient.getRoomHierarchy(parent, 50, 10)
    const tree = await getSpaceStructure(props.matrixClient, parent, false, hierarchy)
    console.log(tree)
    setStructure(tree)
  }

  const spaceChild = async (e, space, add) => {
    e && e.preventDefault()
    const body = {
      via:
        [process.env.REACT_APP_MATRIX_BASE_URL],
      suggested: false,
      auto_join: true
    }
    await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${parent}/state/m.space.child/${space}`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify(add ? body : { }) // if we add a space to an existing one we need to send the object 'body', to remove a space we send an empty object.
    }).catch(console.log)
    createStructurObject()
  }

  function addSpace (e) {
    e.preventDefault()
    const createSpace = async (title) => {
      setDisableButton(true)
      const opts = (type, name, history) => {
        return {
          preset: 'private_chat',
          name: name,
          room_version: '7',
          creation_content: { type: 'm.space' },
          initial_state: [{
            type: 'm.room.history_visibility',
            content: { history_visibility: history } //  world_readable
          },
          {
            type: 'dev.medienhaus.meta',
            content: {
              version: '0.3',
              rundgang: 21,
              type: type,
              published: 'draft'
            }
          },
          {
            type: 'm.room.guest_access',
            state_key: '',
            content: { guest_access: 'can_join' }
          }],
          visibility: 'public'
        }
      }

      // create the space for the context
      const space = await props.matrixClient.createRoom(opts('context', title, 'world_readable')).catch(console.log)
      // add this subspaces as children to the root space
      spaceChild(e, space.room_id, true)
      console.log('created Context ' + newContext)

      setDisableButton(false)
      return space
    }
    createSpace(newContext)
  }

  useEffect(() => {
    console.log('yes i was fired')
    createStructurObject()
  }, [])

  return (
    <>
      <h2>Manage Contexts</h2>
      {structure
        ? <div>{Object.entries(structure).map(parent => {
          return Object.entries(parent[1].children).map(room => {
            return <button key={room.id} value={room[1].name} style={selectedContext === room[1].id ? { color: 'red' } : null} onClick={() => setSelectedContext(room[1].id)}>{room[1].name}</button>
          })
        })}</div>
        : <Loading />}
      <label htmlFor="name">{t('Parent')}: </label>
      <input type="text" value={parentName} disabled />
      <RemoveContext t={t} selectedContext={selectedContext} parent={parent} parentName={parentName} disableButton={disableButton} callback={spaceChild} />
      <CreateContext t={t} parent={parent} matrixClient={props.matrixClient} setNewContext={setNewContext} parentName={parentName} disableButton={disableButton} callback={addSpace} />
      <ProjectImage projectSpace={selectedContext} changeProjectImage={() => console.log('changed image')} />
      <AddLocation callback={() => console.log('callback')} />

      <h2> Show Context</h2>
      <ShowContexts t={t} selectedContext={selectedContext} parent={parent} parentName={parentName} disableButton={disableButton} callback={spaceChild} />

    </>
  )
}
export default ManageContexts
