import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateContext from '../../admin/components/CreateContext'
import { RemoveContext } from '../../admin/components/RemoveContext'
import * as _ from 'lodash'
import ProjectImage from '../../create/ProjectImage'
import { Loading } from '../../../components/loading'
import DisplayEvents from '../../create/Location/components/DisplayEvents'
import DeleteButton from '../../create/components/DeleteButton'
import SimpleContextSelect from '../../../components/SimpleContextSelect'
// import ContextDropdown from '../../../components/ContextDropdown'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import locations from '../../../assets/data/locations.json'
import { MatrixEvent } from 'matrix-js-sdk'
import config from '../../../config.json'
import TextareaAutosize from 'react-textarea-autosize'

import findPathDeep from 'deepdash/findPathDeep'
import findValueDeep from 'deepdash/findValueDeep'

import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { Icon } from 'leaflet/dist/leaflet-src.esm'
import RemoveItemsInContext from './RemoveItemsInContext'

import styled from 'styled-components'
import { fetchId, fetchTree, triggerApiUpdate } from '../../../helpers/MedienhausApiHelper'
import Matrix from '../../../Matrix'
import LeaveContext from './LeaveContext'

const DangerZone = styled.section`
  border: none;
  border-left-color: var(--color-no);
  border-left-radius: unset;
  border-left-style: solid;
  border-left-width: calc(var(--margin) * 0.5);
  padding-left: var(--margin);
`

const Details = styled.details`
  h3 {
    display: inline;
  }

  section {
    padding-top: var(--margin);
  }
`

const ManageContexts = ({ matrixClient, moderationRooms: incomingModerationRooms }) => {
  const { t } = useTranslation('moderate')
  const [selectedContext, setSelectedContext] = useState('')
  const [roomName, setRoomName] = useState('')
  const [roomTemplate, setRoomTemplate] = useState('')
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
  const [currentLocation, setCurrentLocation] = useState('')
  const [moderationRooms, setModerationRooms] = useState(incomingModerationRooms)
  const [editRoomName, setEditRoomName] = useState(false)
  const [newRoomName, setNewRoomName] = useState()

  const createStructurObject = async (roomId, location = false) => {
    async function getSpaceStructure (matrixClient, motherSpaceRoomId, includeRooms) {
      setDisableButton(true)
      setLoading(true)
      const result = {}

      function createSpaceObject (id, name, metaEvent, topic) {
        return {
          id,
          name,
          type: metaEvent.content.type,
          topic,
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
    const tree = await fetchTree(process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID)
    setInputItems(tree)
    const _moderationRooms = { ...moderationRooms }
    for (const space of Object.keys(incomingModerationRooms)) {
      const contextObject = findValueDeep(
        tree,
        (value, key, parent) => {
          if (value.id === space) return true
        }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true })

      if (!contextObject) {
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') console.debug('not found in tree: ' + incomingModerationRooms[space].name)
        delete _moderationRooms[space]
      }
    }
    setModerationRooms(_moderationRooms)
    const fetchLocationTree = await fetch(config.medienhaus.api + config.medienhaus.locationId + '/tree')
    const locationResponse = await fetchLocationTree.json()
    setLocationStructure(locationResponse.children)
    setLoading(false)
  }

  const onRemoveItemFromContext = (space) => {
    setLoading(true)
    Matrix.removeSpaceChild(selectedContext, space)
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
              'm.room.power_levels': 50,
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
          name,
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
      await Matrix.addSpaceChild(selectedContext, space.room_id)
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
      triggerApiUpdate(newContext, selectedContext)
      // we add our newly created context to the context object to be able to work on it before the api is done fetching.
      const subContextObject = {
        id: newContext,
        room_id: newContext,
        name,
        template,
        type: 'context'
      }

      // const parentObject = findValueDeep(
      //   inputItems,
      //   (value, key, parent) => {
      //     if (value.id === selectedContext) return true
      //   }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true })
      setModerationRooms(prevState => Object.assign(prevState, {
        [newContext]: subContextObject
      }))

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
      const fetchSpace = await fetchId(space)
      if (fetchSpace.parents) {
        for (const id of fetchSpace.parents) {
          const parent = await fetchId(id)
          if (parent.template.includes('location')) setCurrentLocation(parent.id)
        }
      }
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
    // if (config.medienhaus.api) triggerApiUpdate(selectedContext)
    setLoading(false)
  }

  const onContextChange = async (context) => {
    setLoading(true)
    let contextObject
    if (config.medienhaus.api) {
      // if an api is configured we fetch id of the selected context
      const fetchPath = await fetchId(context).catch(console.log)
      if (fetchPath) {
        // and then its first parent item
        contextObject = fetchPath
        contextObject.parents ? setContextParent(contextObject.parents[0]) : setContextParent(null)
        setDescription(contextObject
          .description.default || '')
      } else {
        // as a fallback we look for the parent with deep dash
        findValueWithDeepDash()
      }
    } else {
      // if no api is configured we look fot the parent with deep dash
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
    setNewRoomName(contextObject.name)
    setRoomName(contextObject.name)
    setRoomTemplate(contextObject.template)
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
      if (config.medienhaus.api) triggerApiUpdate(selectedContext)
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
    if (config.medienhaus.api) triggerApiUpdate(selectedContext)
  }

  const addContextToLocation = async (location) => {
    console.log('object')
    if (currentLocation) await Matrix.removeSpaceChild(currentLocation, selectedContext)
    await Matrix.addSpaceChild(location, selectedContext).catch(async () => {
      const join = await matrixClient.joinRoom(location).catch(console.log)
      if (join) addContextToLocation(location)
    })

    setCurrentLocation(location)
  }

  const changeRoomName = async () => {
    const changeName = await matrixClient.setRoomName(selectedContext, newRoomName).catch(console.log)
    if (!changeName.event_id) return
    setRoomName(newRoomName)
    if (config.medienhaus.api) triggerApiUpdate(selectedContext)
    setEditRoomName(false)
  }

  const onChangeRoomTemplate = async () => {
    await matrixClient.getStateEvent(selectedContext, 'dev.medienhaus.meta')
    if (config.medienhaus.api) triggerApiUpdate(selectedContext)
  }

  const onRemoveContext = async (e, parent) => {
    e.preventDefault()
    setDisableButton(true)
    const remove = await Matrix.removeSpaceChild(selectedContext, parent)
    if (remove.event_id) {
      const _moderationRooms = { ...moderationRooms }
      delete _moderationRooms[selectedContext]
      setModerationRooms(_moderationRooms)
      setSelectedContext('')
      if (config.medienhaus.api) triggerApiUpdate(selectedContext)
    } else {
      // @TODO error handleing
    }
    setDisableButton(false)
  }

  const onLeaveContext = async (e, parent) => {
    e.preventDefault()
    setDisableButton(true)
    await setPower(localStorage.getItem('mx_user_id'), selectedContext, 0)
    await matrixClient.leave(selectedContext).catch(() => {
      // @TODO error handleing
      setDisableButton(false)
    }
    )
    const _moderationRooms = { ...moderationRooms }
    delete _moderationRooms[selectedContext]
    setModerationRooms(_moderationRooms)
    setSelectedContext('')
    if (config.medienhaus.api) triggerApiUpdate(selectedContext)

    setSelectedContext('')
    setDisableButton(false)
  }

  return (
    <>
      <section className="manage">
        <h3>{t('Select Context')}</h3>
        {// !structure ? <Loading /> : <ShowContexts structure={structure} t={t} selectedContext={selectedContext} parent={parent} parentName={parentName} disableButton={disableButton} callback={contextualise} />
        }
        {!inputItems && !moderationRooms
          ? <Loading />
          : <SimpleContextSelect
              onItemChosen={onContextChange}
              selectedContext={selectedContext}
              struktur={moderationRooms}
              disabled={loading}
            />}
        {loading && inputItems && <Loading />}
        {/* <label htmlFor="name">{t('Context')}: </label>
         <input type="text" value={selectedContextName} disabled /> */}
        {selectedContext &&
          <>
            <hr />
            <Details>
              <summary>
                <h3>{t('Change Name')}</h3>
              </summary>
              <section>

                <input id="title" maxLength="100" name="title" type="text" value={newRoomName} onChange={(e) => { setEditRoomName(true); setNewRoomName(e.target.value) }} />
                <div className="confirmation">
                  {editRoomName &&
                    <>
                      <button
                        className="cancel"
                        onClick={() => {
                          if (editRoomName) setNewRoomName(roomName)
                          setEditRoomName(false)
                        }}
                      >{editRoomName ? t('cancel') : t('edit name')}
                      </button>
                      <LoadingSpinnerButton className="confirm" onClick={changeRoomName}>SAVE</LoadingSpinnerButton>
                    </>}
                </div>
              </section>
            </Details>
            <Details>
              <summary>
                <h3>{t('Change Template')}</h3>
              </summary>
              <section>
                <select value={roomTemplate} onChange={onChangeRoomTemplate}>
                  <option disabled value="">--- Please choose a type of context ---</option>
                  {Object.keys(config.medienhaus.context).map(context => {
                    return <option key={config.medienhaus.context[context].label} value={context}>{config.medienhaus.context[context].label}</option>
                  })}
                </select>
              </section>
            </Details>
            <Details>
              <summary>
                <h3>{t('Change Image')}</h3>
              </summary>
              <section>
                <ProjectImage projectSpace={selectedContext} changeProjectImage={() => console.log('changed image')} disabled={loading || disableButton} apiCallback={() => triggerApiUpdate(selectedContext)} />
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
                                        <Marker position={[location.lat, location.lng]} icon={(new Icon.Default({ imagePath: '/leaflet/' }))}>
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
              </section>

            </Details>

            <Details>
              <summary>
                <h3>{t('Change Description')}</h3>
              </summary>
              <section>
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
            </Details>
            <Details>
              <summary>
                <h3>{t('Change Location')}</h3>
              </summary>
              <section className="manage--add-location">
                {locationStructure
                  ? <SimpleContextSelect
                      location
                      onItemChosen={addContextToLocation}
                      selectedContext={currentLocation}
                      struktur={locationStructure}
                      disabled={loading}
                      enableType="location-room"
                    />
                  : <Loading />}
              </section>
            </Details>
            <Details>
              <summary>
                <h3>{t('Add Sub-Context')}</h3>
              </summary>
              <section>
                <CreateContext t={t} parent={selectedContext} matrixClient={matrixClient} parentName={roomName} disableButton={loading} callback={addSpace} />
              </section>
            </Details>
            <Details>
              <summary>
                <h3>{t('Remove Item from context')}</h3>
              </summary>
              <section>
                <RemoveItemsInContext parent={selectedContext} onRemoveItemFromContext={onRemoveItemFromContext} />
              </section>
            </Details>
            <hr />
            {contextParent && (
              <DangerZone>
                <Details>
                  <summary>
                    <h3>⚠️&nbsp;&nbsp;DANGER ZONE&nbsp;‼️</h3>
                  </summary>
                  <section>
                    <Details>
                      <summary><h3>{t('Remove Context')}</h3></summary>
                      <RemoveContext t={t} selectedContext={selectedContext} parent={contextParent} parentName={roomName} disableButton={disableButton} callback={onRemoveContext} />
                    </Details>
                  </section>
                  <section>
                    <Details>
                      <summary><h3>{t('Leave Context')}</h3></summary>
                      <LeaveContext selectedContext={selectedContext} parent={contextParent} parentName={roomName} disableButton={disableButton} callback={onLeaveContext} />
                    </Details>
                  </section>
                </Details>
              </DangerZone>
            )}
          </>}

      </section>
    </>
  )
}
export default ManageContexts
