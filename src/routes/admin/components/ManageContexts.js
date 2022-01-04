/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateContext from './CreateContext'
import { RemoveContext } from './RemoveContext'
import { ShowContexts } from './ShowContexts'
import * as _ from 'lodash'
import ProjectImage from '../../create/ProjectImage'
import AddLocation from '../../create/AddContent/AddLocation'
import { Loading } from '../../../components/loading'
import AddEvent from '../../create/DateAndVenue/components/AddEvent'
import DisplayEvents from '../../create/DateAndVenue/components/DisplayEvents'
import DeleteButton from '../../create/components/DeleteButton'
import deleteContentBlock from '../../create/functions/deleteContentBlock'
import SimpleContextSelect from '../../../components/SimpleContextSelect'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import locations from '../../../assets/data/locations.json'
import { set } from 'react-hook-form'
import { MatrixEvent } from 'matrix-js-sdk'

const ManageContexts = (props) => {
  const { t } = useTranslation('admin')
  const [selectedContext, setSelectedContext] = useState('')
  const [selectedContextName, setSelectedContextName] = useState('')
  const [structure, setStructure] = useState()
  const [newContext, setNewContext] = useState('')
  const [parentName, setParentName] = useState('Stechlin')
  // eslint-disable-next-line no-unused-vars
  const [disableButton, setDisableButton] = useState(false)
  const [parent] = useState(process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID)
  const [contextParent, setContextParent] = useState('')
  const [currentContext, setCurrentContext] = useState(null)
  const [inputItems, setInputItems] = useState()
  const [events, setEvents] = useState([])
  const [allocation, setAllocation] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(false)

  const createStructurObject = async () => {
    async function getSpaceStructure (matrixClient, motherSpaceRoomId, includeRooms) {
      setDisableButton(true)
      setLoading(true)
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
      setLoading(false)
      setDisableButton(false)
      return result
    }

    function translateJson (origin) {
      origin.childs = []
      if (origin.children && Object.keys(origin.children).length > 0) {
        const childs = parseChilds(origin.children)
        childs.forEach((child, i) => {
          origin.childs[i] = translateJson(child)
        })
      }
      origin.children = origin.childs
      delete origin.childs
      return origin
    }

    function parseChilds (data) {
      if (data) {
        const result = []
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            result.push(key)
          }
        }
        return result.map(r => data[r])
      } else { return {} }
    }
    console.log('---- started structure ----')
    const tree = await getSpaceStructure(props.matrixClient, parent, false)
    setInputItems(tree)
    const translatedJson = translateJson(tree[Object.keys(tree)[0]])
    setStructure(translatedJson)
  }
  const spaceChild = async (e, space, add) => {
    setLoading(true)
    e && e.preventDefault()
    const body = {
      via:
        [process.env.REACT_APP_MATRIX_BASE_URL],
      suggested: false,
      auto_join: true
    }
    await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${add ? selectedContext : space}/state/m.space.child/${add ? space : selectedContext}`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify(add ? body : { }) // if we add a space to an existing one we need to send the object 'body', to remove a space we send an empty object.
    }).catch(console.log)
    add ? console.log('added as child to ' + selectedContext) : console.log('removed ' + selectedContext + ' from' + contextParent)
    await createStructurObject()
    setLoading(false)
  }

  const setPower = async (userId, roomId, level) => {
    console.log('changing power level for ' + userId)
    props.matrixClient.getStateEvent(roomId, 'm.room.power_levels', '').then(async (res) => {
      const powerEvent = new MatrixEvent({
        type: 'm.room.power_levels',
        content: res
      }
      )
      // something here is going wrong for collab > 2
      await props.matrixClient.setPowerLevel(roomId, userId, level, powerEvent).catch(err => console.error(err))
    })
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
      await spaceChild(e, space.room_id, true)
      console.log('created Context ' + newContext + ' ' + space.room_id)
      // invite admins to newly created space
      if (process.env.REACT_APP_USER1 === localStorage.getItem('medienhaus_user_id')) {
        await props.matrixClient.invite(space.room_id, process.env.REACT_APP_USER2).catch(console.log)
        await setPower(process.env.REACT_APP_USER2, space.room_id, 50)
      } else {
        await props.matrixClient.invite(space.room_id, process.env.REACT_APP_USER1).catch(console.log) // @TODO change to userIds
        await setPower(process.env.REACT_APP_USER1, space.room_id, 50)
      }
      setDisableButton(false)
      return space
    }
    createSpace(newContext)
  }

  const contextualise = (d3) => {
    console.log(d3)
    setSelectedContext(d3.data.id)
    setSelectedContextName(d3.data.name)
    setContextParent(d3.parent.data.id)
  }
  const fetchAllocation = async (space) => setAllocation(await props.matrixClient.getStateEvent(space, 'dev.medienhaus.allocation').catch(console.log))

  const getEvents = async (space) => {
    setLoading(true)
    setEvents([])
    setAllocation([])
    await fetchAllocation(space)
    const checkSubSpaes = await props.matrixClient.getSpaceSummary(space, 0).catch(console.log)
    const checkForEvents = checkSubSpaes?.rooms?.filter(child => child.name.includes('_event'))
    if (!_.isEmpty(checkForEvents)) {
      const eventSummary = await Promise.all(checkForEvents.map(room => props.matrixClient.getSpaceSummary(room.room_id, 0).catch(err => console.log(err)))) // then we fetch the summary of all spaces within the event space
      const onlyEvents = eventSummary
        ?.filter(room => room !== undefined) // we filter undefined results. @TODO DOM seems to be rendering to quickly here. better solution needed
        .map(event => event?.rooms)
        .filter(room => room.name?.charAt(0) !== 'x') // finally we remove any spaces in here since we only want the content room
      // check for empty event spaces and delete those
      // onlyEvents.filter(space => space.length === 0).map(emptySpace => onDelete(null, emptySpace.))
      setEvents(onlyEvents)
    }
    setLoading(false)
  }
  const onContextChange = async (context) => {
    setLoading(true)
    await getEvents(context.id)
    setSelectedContext(context.id)
    setSelectedContextName(context.name)
    setContextParent(context.pathIds[context.pathIds.length - 1])
    // setParentName(context.path[context.path.length - 1])
    setLoading(false)
  }
  useEffect(() => {
    createStructurObject()
    // createD3Json()
    // eslint-disable-next-line
  }, [])

  const onDelete = async (index) => {
    setDeleting(true)
    try {
      const deletedAllocation = {
        version: '1.0',
        physical: allocation.physical.filter((location, i) => i !== index)
      }

      props.matrixClient.sendStateEvent(selectedContext, 'dev.medienhaus.allocation', deletedAllocation)
      await getEvents(selectedContext)
    } catch (err) {
      console.error(err)
      setDeleting('couldn’t delete event, please try again or try reloading the page')
      setTimeout(() => {
        setDeleting()
      }, 2000)
    } finally {
      setDeleting()
    }
  }
  return (
    <>
      <h2>Manage Contexts</h2>
      {// !structure ? <Loading /> : <ShowContexts structure={structure} t={t} selectedContext={selectedContext} parent={parent} parentName={parentName} disableButton={disableButton} callback={contextualise} />
      }
      {!inputItems
        ? <Loading />
        : <SimpleContextSelect
            onItemChosen={onContextChange}
            selectedContext={selectedContextName}
            struktur={inputItems}
            disabled={loading}
          />}
      {loading && inputItems && <Loading />}
      {/* <label htmlFor="name">{t('Context')}: </label>
       <input type="text" value={selectedContextName} disabled /> */}
      <RemoveContext t={t} selectedContext={selectedContext} parent={contextParent} parentName={parentName} disableButton={disableButton} callback={spaceChild} />
      <CreateContext t={t} parent={selectedContext} matrixClient={props.matrixClient} setNewContext={setNewContext} parentName={parentName} disableButton={!newContext || loading} callback={addSpace} />
      {selectedContextName &&
        <>
          <div>
            <h2>Edit currently selected context</h2>
            <h2>Image</h2>
            <ProjectImage projectSpace={selectedContext} changeProjectImage={() => console.log('changed image')} disabled={loading} />
          </div>
          {allocation?.physical && allocation.physical.map((location, i) => {
            return (
              <div className="editor" key={location.lat}>
                <div className="left">
                  <span>🎭</span>
                </div>
                <div
                  className={location.lat === '0.0' && location.lng === '0.0' ? 'center' : null}
                >
                  {
                                location.lat !== '0.0' && location.lng !== '0.0' &&
                                  <MapContainer className="center" center={[location.lat, location.lng]} zoom={17} scrollWheelZoom={false} placeholder>
                                    <TileLayer
                                      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={[location.lat, location.lng]}>
                                      <Popup>
                                        {locations.find(coord => coord.coordinates === location.lat + ', ' + location.lng)?.name || // if the location is not in our location.json
                                        location.info?.length > 0 // we check if the custom input field was filled in
                                          ? location.info // if true, we display that text on the popup otherwise we show the lat and long coordinates
                                          : location.lat + ', ' + location.lng}
                                      </Popup>
                                    </Marker>
                                  </MapContainer>
                              }
                  {location.info && <input type="text" value={location.info} disabled />}
                </div>
                <div className="right">
                  <DeleteButton
                    deleting={deleting}
                    onDelete={() => onDelete(i)}
                    block={allocation.physical[0]} // the actual event space not the location itself
                    index={events.length + i + 1}
                    reloadSpace={() => getEvents(selectedContext)}
                  />
                </div>
              </div>
            )
          })}
          {events && (events.map((event, i) => {
            return (
              <div className="editor" key={event.name}>
                <div className="left">
                  <span>🎭</span>
                </div>
                <div className="center">
                  {event.filter(room => room.room_type !== 'm.space').filter(room => room.name.charAt(0) !== 'x') // filter rooms that were deleted
                    .map((event, i) => {
                      return <DisplayEvents event={event} i={i} key={i} />
                    })}
                </div>
                <div className="right">
                  <DeleteButton
                    deleting={deleting}
                    onDelete={onDelete}
                    block={event[0]} // the actual event space not the location itself
                    index={events.length + i + 1}
                    reloadSpace={() => console.log('deleted')}
                  />
                </div>
              </div>
            )
          }))}
          <AddEvent
            length={events.length}
            room_id={selectedContext}
            t={t}
            reloadSpace={() => getEvents(selectedContext)}
            locationDropdown
            inviteCollaborators={console.log}
            allocation={allocation}
            disabled={loading}
          />
        </>}
    </>
  )
}
export default ManageContexts
