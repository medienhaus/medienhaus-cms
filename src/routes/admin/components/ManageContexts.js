/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateContext from './CreateContext'
import { RemoveContext } from './RemoveContext'
import * as _ from 'lodash'
import ProjectImage from '../../create/ProjectImage'
import { Loading } from '../../../components/loading'
import AddEvent from '../../create/Location/components/AddEvent'
import DisplayEvents from '../../create/Location/components/DisplayEvents'
import DeleteButton from '../../create/components/DeleteButton'
import SimpleContextSelect from '../../../components/SimpleContextSelect'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import locations from '../../../assets/data/locations.json'
import { MatrixEvent } from 'matrix-js-sdk'
import config from '../../../config.json'
import TextareaAutosize from 'react-textarea-autosize'

import findPathDeep from 'deepdash/findPathDeep'
import findValueDeep from 'deepdash/findValueDeep'

import styled from 'styled-components'
import Matrix from '../../../Matrix'

const DangerZone = styled.section`
  border: none;
  border-left-color: var(--color-no);
  border-left-radius: unset;
  border-left-style: solid;
  border-left-width: calc(var(--margin) * 0.5);
  margin-top: calc(var(--margin) * 4) !important;
  padding-left: var(--margin);
`

const ManageContexts = ({ matrixClient, moderationRooms: moderationRoomsInit }) => {
  const { t } = useTranslation('admin')
  const [selectedContext, setSelectedContext] = useState('')
  const [parentName] = useState('')
  // eslint-disable-next-line no-unused-vars
  const [disableButton, setDisableButton] = useState(false)
  const [parent] = useState(process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID)
  const [contextParent, setContextParent] = useState('')
  const [inputItems, setInputItems] = useState()
  const [events, setEvents] = useState([])
  const [allocation, setAllocation] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [locationStructure, setLocationStructure] = useState()
  const [currentLocation, setCurrentLocation] = useState()
  const [moderationRooms, setModerationRooms] = useState(moderationRoomsInit)

  const createStructurObject = async (roomId, location = false) => {
    async function getSpaceStructure (matrixClient, motherSpaceRoomId, includeRooms) {
      setDisableButton(true)
      setLoading(true)
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
        // console.log(path)
        const stateEvents = await matrixClient.roomState(spaceId).catch(console.log)
        // check if room exists in roomHierarchy
        // const existsInCurrentTree = _.find(hierarchy, {room_id: spaceId})
        // const metaEvent = await matrixClient.getStateEvent(spaceId, 'dev.medienhaus.meta')
        const metaEvent = _.find(stateEvents, { type: 'dev.medienhaus.meta' })
        if (!metaEvent) return
        if (location && !metaEvent.content?.template?.includes('location')) return
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
      setLoading(false)
      setDisableButton(false)
      return result
    }

    console.log('---- started structure ----')
    const tree = await getSpaceStructure(matrixClient, roomId, false)
    return tree
  }

  const fetchTreeFromApi = async () => {
    const fetchTree = await fetch(config.medienhaus.api + process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID + '/tree')
    const response = await fetchTree.json()
    setInputItems(response.children)
    const fetchLocationTree = await fetch(config.medienhaus.api + config.medienhaus.locationId + '/tree')
    const locationResponse = await fetchLocationTree.json()
    setLocationStructure(locationResponse.children)
    setLoading(false)
  }
  const spaceChild = async (e, space, add) => {
    setLoading(true)
    e && e.preventDefault()
    const body = {
      via: [process.env.REACT_APP_MATRIX_BASE_URL.replace('https://', '')],
      suggested: false,
      auto_join: false
    }
    await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${add ? selectedContext : space}/state/m.space.child/${add ? space : selectedContext}`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify(add ? body : { }) // if we add a space to an existing one we need to send the object 'body', to remove a space we send an empty object.
    }).catch(console.log)
    add ? console.log('added as child to ' + selectedContext) : console.log('removed ' + selectedContext + ' from ' + contextParent)
    // if (config.medienhaus.api) fetchTreeFromApi()
    // else await createStructurObject()
    if (add) {
      setSelectedContext(space)
    } else {
      setSelectedContext('')
    }
    setLoading(false)
  }

  const setPower = async (userId, roomId, level) => {
    console.log('changing power level for ' + userId)
    const currentStateEvent = await matrixClient.getStateEvent(roomId, 'm.room.power_levels', '')
    const newStateEvent = new MatrixEvent({
      type: 'm.room.power_levels',
      content: currentStateEvent
    })
    await matrixClient.setPowerLevel(roomId, userId, level, newStateEvent).catch(err => console.error(err))
  }

  async function addSpace (e, name, template, callback) {
    e.preventDefault()
    const createSpace = async (title) => {
      setDisableButton(true)
      const medienhausMeta = {
        version: '0.4',
        type: 'context',
        published: 'public'
      }
      // if there is a template defined we add it to de state event
      if (template) medienhausMeta.template = template

      const opts = (name, history) => {
        return {
          preset: 'public_chat',
          power_level_content_override: {
            ban: 50,
            events: {
              'm.room.avatar': 50,
              'm.room.canonical_alias': 50,
              'm.room.encryption': 100,
              'm.room.history_visibility': 100,
              'm.room.name': 50,
              'm.room.power_levels': 100,
              'm.room.server_acl': 100,
              'm.room.tombstone': 100,
              'm.space.child': 0, // @TODO this needs to be a config flag, wether users are allowed to just add content to contexts or need to knock and be invited first.
              'm.room.topic': 50,
              'm.room.pinned_events': 50,
              'm.reaction': 50,
              'im.vector.modular.widgets': 50
            },
            events_default: 50,
            historical: 100,
            invite: 50,
            kick: 50,
            redact: 50,
            state_default: 50,
            users_default: 0
          },
          name: name,
          room_version: '9',
          creation_content: { type: 'm.space' },
          initial_state: [{
            type: 'm.room.history_visibility',
            content: { history_visibility: 'world_readable' } //  history
          },
          {
            type: 'dev.medienhaus.meta',
            content: medienhausMeta
          },
          {
            type: 'm.room.guest_access',
            state_key: '',
            content: { guest_access: 'can_join' }
          }],
          visibility: 'private' // visibility is private even for public spaces.
        }
      }

      // create the space for the context
      const space = await matrixClient.createRoom(opts(title, 'world_readable')).catch(console.log)

      // add this subspaces as children to the root space
      await spaceChild(e, space.room_id, true)
      console.log('created Context ' + name + ' ' + space.room_id)
      // invite moderators to newly created space if they are specified in our config.json
      if (config.medienhaus?.usersToInviteToNewContexts) {
        for await (const user of config.medienhaus?.usersToInviteToNewContexts) {
          console.log(user)
          if (user === localStorage.getItem('medienhaus_user_id')) continue // if the user is us, we jump out of the loop
          console.log('inviting ' + user)
          await matrixClient.invite(space.room_id, user).catch(console.log)
          await setPower(user, space.room_id, 50)
        }
      }
      return space.room_id
    }

    const newContext = await createSpace(name)
    if (config.medienhaus.api) {
      // we add our newly created context to the context object to be able to work on it before the api is done fetching.
      const subContextObject = {
        id: newContext,
        room_id: newContext,
        name: name,
        template: template,
        type: 'context'
      }

      // const parentObject = findValueDeep(
      //   inputItems,
      //   (value, key, parent) => {
      //     if (value.id === selectedContext) return true
      //   }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true })
      setModerationRooms(prevState => {
        const newState = [...prevState]
        newState.push(subContextObject)
        return newState
      })
      const pathToPushTo = findPathDeep(
        inputItems,
        (value, key, parent) => {
          if (value.id === selectedContext) return true
        }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true, pathFormat: 'array' })

      pathToPushTo.push('children')
      pathToPushTo.push(newContext)
      setInputItems(prevState => _.set({ ...prevState }, pathToPushTo, subContextObject))
      setSelectedContext(newContext)

      if (callback) callback()
      setDisableButton(false)
    }
  }

  const fetchAllocation = async (space) => setAllocation(await matrixClient.getStateEvent(space, 'dev.medienhaus.allocation').catch(console.log))

  function findNested (obj, key, value) {
    if (obj[key] === value) {
      return obj
    } else {
      const keys = Object.keys(obj) // add this line to iterate over the keys
      console.log(keys)
      for (let i = 0, len = keys.length; i < len; i++) {
        const k = keys[0] // use this key for iteration, instead of index "i"

        // add "obj[k] &&" to ignore null values
        if (obj[k] && typeof obj[k] === 'object') {
          const found = findNested(obj[k], key, value)
          if (found) {
          // If the object was found in the recursive call, bubble it up.
            return found
          }
        }
      }
    }
  }

  const getEvents = async (space) => {
    setLoading(true)
    setEvents([])
    setAllocation([])
    setCurrentLocation('')
    await fetchAllocation(space)
    if (config.medienhaus.api) {
      const fetchSpace = await fetch(config.medienhaus.api + space)
      const response = await fetchSpace.json()
      if (response.parents) setCurrentLocation(parent[parent.length - 1])
    } else {
      const idExistsInLocationStructure = findNested(locationStructure, 'id', space)
      if (idExistsInLocationStructure) {
        console.log(idExistsInLocationStructure)
        setCurrentLocation(idExistsInLocationStructure.pathIds[idExistsInLocationStructure.length - 1])
        console.log(idExistsInLocationStructure.pathIds[idExistsInLocationStructure.length - 1])
      }
    }
    const checkSubSpaes = await matrixClient.getRoomHierarchy(space, 1).catch(console.log)
    const checkForEvents = checkSubSpaes?.rooms?.filter(child => child.name.includes('_event'))
    if (!_.isEmpty(checkForEvents)) {
      const eventSummary = await Promise.all(checkForEvents.map(room => matrixClient.getRoomHierarchy(room.room_id, 0).catch(err => console.log(err)))) // then we fetch the summary of all spaces within the event space
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
    let contextObject
    if (config.medienhaus.api) {
      const fetchPath = await fetch(config.medienhaus.api + context).catch(console.log)
      if (fetchPath.ok) {
        const response = await fetchPath.json().catch(console.log)
        contextObject = response
        console.log(contextObject)
        contextObject.parents ? setContextParent(contextObject.parents[0]) : setContextParent(null)
        setDescription(contextObject
          .description.default || '')
      } else {
        findValueWithDeepDash()
      }
    } else {
      findValueWithDeepDash()
    }
    function findValueWithDeepDash () {
      contextObject = findValueDeep(
        inputItems,
        (value, key, parent) => {
          if (value.id === context) return true
        }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true })
      console.log(contextObject)
      contextObject.pathIds ? setContextParent(contextObject.pathIds[contextObject.pathIds.length - 1]) : setContextParent(null)
      setDescription(contextObject
        .topic || '')
    }
    await getEvents(context)
    setSelectedContext(context)
    setLoading(true)
    await getEvents(context)
    setSelectedContext(context)

    // setParentName(context.path[context.path.length - 1])
    setLoading(false)
  }

  useEffect(() => {
    const getStructures = async () => {
      const tree = await createStructurObject(parent)
      console.log(tree)
      setInputItems(tree)

      const locationTree = await createStructurObject(config.medienhaus.locationId, true)
      console.log(locationTree)
      setLocationStructure(locationTree)
    }

    // createD3Json()
    if (config.medienhaus.api) fetchTreeFromApi()
    else getStructures()
    // eslint-disable-next-line
  }, [])

  const onDelete = async (index) => {
    setDeleting(true)
    try {
      const deletedAllocation = {
        version: '1.0',
        physical: allocation.physical.filter((location, i) => i !== index)
      }

      matrixClient.sendStateEvent(selectedContext, 'dev.medienhaus.allocation', deletedAllocation)
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

  const onSave = async () => {
    if (description.length > 500) return
    await matrixClient.setRoomTopic(selectedContext, description).catch(console.log)
  }

  const addContextToLocation = async (location) => {
    console.log('object')
    if (currentLocation) await Matrix.removeSpaceChild(currentLocation, selectedContext)
    await Matrix.addSpaceChild(location.id, selectedContext).catch(console.log)
    setCurrentLocation(location.id)
  }
  return (
    <>
      <section className="manage">
        <section className="manage--add-subcontext">
          <h3>Manage contexts</h3>
          {// !structure ? <Loading /> : <ShowContexts structure={structure} t={t} selectedContext={selectedContext} parent={parent} parentName={parentName} disableButton={disableButton} callback={contextualise} />
          }
          {!inputItems
            ? <Loading />
            : <SimpleContextSelect
                onItemChosen={onContextChange}
                selectedContext={selectedContext}
                preSelectedValue="context"
                struktur={inputItems}
                disabled={loading}
                moderationRooms={moderationRooms}
              />}
          {loading && inputItems && <Loading />}
        </section>
        {/* <label htmlFor="name">{t('Context')}: </label>
         <input type="text" value={selectedContextName} disabled /> */}
        {selectedContext &&
          <>
            <section className="manage--add-subcontext">
              <h3>{t('Add sub-context')}</h3>
              <CreateContext t={t} parent={selectedContext} matrixClient={matrixClient} parentName={parentName} disableButton={loading} callback={addSpace} />
            </section>
            <section className="manage--add-image">
              <h3>{t('Add image')}</h3>
              <ProjectImage projectSpace={selectedContext} changeProjectImage={() => console.log('changed image')} disabled={loading} />
            </section>
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
            <section className="manage--add-description">
              <h3>{t('Add description')}</h3>
              <TextareaAutosize
                value={description}
                minRows={6}
                placeholder={`${t('Please add a short description.')}`}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={onSave}
              />
              {description.length > 500 && (<>
                <p>{t('Characters:')} {description.length}</p>
                <p>❗️{t('Please keep the descrpition under 500 characters.')} {description.length}</p>
              </>
              )}
            </section>
            <section className="manage--add-location">
              <h3>{t('Add location')}</h3>
              {locationStructure
                ? <SimpleContextSelect
                    onItemChosen={addContextToLocation}
                    selectedContext={currentLocation}
                    struktur={locationStructure}
                    disabled={loading}
                    enableType="location-room"
                  />
                : <Loading />}
            </section>
            <DangerZone className="manage--danger-zone">
              {contextParent && <RemoveContext t={t} selectedContext={selectedContext} parent={contextParent} parentName={parentName} disableButton={disableButton} callback={spaceChild} />}
            </DangerZone>
          </>}
      </section>
    </>
  )
}
export default ManageContexts
