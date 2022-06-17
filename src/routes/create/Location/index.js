import React, { useEffect, useState } from 'react'
// import AddEvent from './components/AddEvent'
// import { useTranslation } from 'react-i18next'
import DisplayContent from '../DisplayContent'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import locations from '../../../assets/data/locations.json'
import * as _ from 'lodash'

import DeleteButton from '../components/DeleteButton'
import deleteContentBlock from '../functions/deleteContentBlock'
import DisplayEvents from './components/DisplayEvents'
import { isArray } from 'lodash'
import { Loading } from '../../../components/loading'
import Matrix from '../../../Matrix'
import SimpleContextSelect from '../../../components/SimpleContextSelect'
import config from '../../../config.json'
import { Icon } from 'leaflet/dist/leaflet-src.esm'

const Location = ({ reloadSpace, inviteCollaborators, projectSpace, events, allocation, matrixClient }) => {
  const [eventSpace, setEventSpace] = useState(events)
  const [eventContent, setEventContent] = useState([])
  const [locationStructure, setLocationStructure] = useState()
  const [oldEvents, setOldEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [currentLocation, setCurrentLocation] = useState()
  // const { t } = useTranslation('date')

  const createStructurObject = async () => {
    setLoading(true)
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

      async function scanForAndAddSpaceChildren (spaceId, path) {
        if (spaceId === 'undefined') return
        const stateEvents = await matrixClient.roomState(spaceId).catch(console.log)

        // check if room exists in roomHierarchy
        // const existsInCurrentTree = _.find(hierarchy, {room_id: spaceId})
        // const metaEvent = await matrixClient.getStateEvent(spaceId, 'dev.medienhaus.meta')
        const metaEvent = _.find(stateEvents, { type: 'dev.medienhaus.meta' })
        if (!metaEvent) return
        // if (!typesOfSpaces.includes(metaEvent.content.type)) return
        if (!metaEvent.content?.template?.includes('location')) return
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
          if (event.state_key === projectSpace) setCurrentLocation(event.room_id) // add context to the contexts array if the projectspace is a child of it
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
      return result
    }
    console.log('---- started structure ----')
    const tree = await getSpaceStructure(config.medienhaus.locationId, false)
    // console.log(tree[Object.keys(tree)[0]])
    setLocationStructure(tree)
  }

  const fetchTreeFromApi = async () => {
    setLoading(true)
    const fetchLocationTree = await fetch(config.medienhaus.api + config.medienhaus.locationId + '/tree/filter/type/context')
    const locationResponse = await fetchLocationTree.json()
    setLocationStructure(locationResponse.children)
    setLoading(false)
  }

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      setOldEvents(eventSpace?.filter((room, i) => i > 0) // ignore the first element since its the space itself
        .filter(room => room.room_type !== 'm.space') // filter all newly created events
        .filter(room => room.name.charAt(0) !== 'x') // filter rooms that were deleted
      )
      const filterDepricatedEvents = eventSpace?.filter(room => room.room_type === 'm.space').filter((room, i) => i > 0) // as always, first space is the space itself therefore we filter it
      const eventSummary = await Promise.all(filterDepricatedEvents.map(room => matrixClient.getRoomHierarchy(room.room_id, 0).catch(err => console.log(err)))) // then we fetch the summary of all spaces within the event space
      const onlyEvents = eventSummary
        ?.filter(room => room !== undefined) // we filter undefined results. @TODO DOM seems to be rendering to quickly here. better solution needed
        .map(event => event?.rooms) // finally we remove any spaces in here since we only want the content room
      // check for empty event spaces and delete those
      // onlyEvents.filter(space => space.length === 0).map(emptySpace => onDelete(null, emptySpace.))
      setEventContent(onlyEvents)
      setLoading(false)
    }
    if (isArray(eventSpace))fetchEvents(events)
  }, [eventSpace, events, matrixClient, projectSpace])

  useEffect(() => {
    setEventSpace(events)
  }, [events])

  useEffect(() => {
    if (config.medienhaus.api) fetchTreeFromApi()
    else createStructurObject()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDelete = async (index) => {
    setDeleting(true)
    try {
      const deletedAllocation = {
        version: '1.0',
        physical: allocation.physical.filter((location, i) => i !== index)
      }

      matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.allocation', deletedAllocation)
      await reloadSpace()
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

  const onLegacyDelete = async (e, roomId, name, index) => {
    e.preventDefault()
    setDeleting(true)
    try {
      await deleteContentBlock(name, roomId, index)
      reloadSpace()
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

  const addContextToLocation = async (location) => {
    if (currentLocation) await Matrix.removeSpaceChild(currentLocation, projectSpace)
    await Matrix.addSpaceChild(location, projectSpace).catch(async () => {
      // if adding spaceChild fails we try to join the space first
      const joinRoom = await matrixClient.joinRoom(location).catch(console.log)
      if (joinRoom) await addContextToLocation(location)
    })
    setCurrentLocation(location.id)
  }

  if (loading) return <Loading />
  return (
    <>
      {oldEvents
        ?.map((event, i) => {
          return <DisplayContent block={event} index={i} blocks={eventSpace} projectSpace={eventSpace} reloadSpace={reloadSpace} key={event + i} mapComponent />
        })}
      {eventSpace?.length > 1 && (eventContent.map((event, i) => {
        return (
          <div className="editor" key={event.name}>
            <div className="left">
              <span>🎭</span>
            </div>
            <div className="center">
              {event.filter(room => room.room_type !== 'm.space').filter(room => room.name.charAt(0) !== 'x') // filter rooms that were deleted
                .map((event, i) => {
                  if (event.name.includes('livestream')) {
                    return <DisplayContent block={event} index={i} blocks={eventSpace} projectSpace={eventSpace} reloadSpace={reloadSpace} key={event + i} mapComponent />
                  } else {
                    return <DisplayEvents event={event} i={i} key={i} />
                  }
                })}
            </div>
            <div className="right">
              <DeleteButton
                deleting={deleting}
                onDelete={onLegacyDelete}
                block={event[0]}
                index={oldEvents.length + i + 1}
                reloadSpace={reloadSpace}
              />
            </div>
          </div>
        )
      }))}
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
                                    <Marker
                                      position={[location.lat, location.lng]}
                                      icon={(new Icon.Default({ imagePath: '/leaflet/' }))}
                                    >
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
                index={events?.length + i + 1}
                reloadSpace={reloadSpace}
              />
            </div>
          </div>
        )
      })}
      {locationStructure &&
        <SimpleContextSelect
          selectedContext=""
          preSelectedValue="location"
          onItemChosen={addContextToLocation}
          struktur={locationStructure}
          disabled={loading || !locationStructure}
        />}
      {/*
      {eventContent?.length < 1 &&
        <AddEvent
          length={0}
          room_id={projectSpace}
          t={t}
          allocation={allocation}
          reloadSpace={reloadSpace}
          inviteCollaborators={inviteCollaborators}
        />}
      */}
    </>
  )
}
export default Location
