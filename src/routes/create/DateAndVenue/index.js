import React, { useEffect, useState } from 'react'
import AddEvent from './components/AddEvent'
import { useTranslation } from 'react-i18next'
import DisplayContent from '../DisplayContent'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import locations from '../../../assets/data/locations.json'

import DeleteButton from '../components/DeleteButton'
import deleteContentBlock from '../functions/deleteContentBlock'
import DisplayEvents from './components/DisplayEvents'
import _, { isArray } from 'lodash'
import { Loading } from '../../../components/loading'

const DateAndVenue = ({ reloadSpace, inviteCollaborators, projectSpace, events, allocation, matrixClient }) => {
  const [eventSpace, setEventSpace] = useState(events)
  const [eventContent, setEventContent] = useState([])
  const [oldEvents, setOldEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { t } = useTranslation('date')

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      setOldEvents(eventSpace?.filter((room, i) => i > 0) // ignore the first element since its the space itself
        .filter(room => room.room_type !== 'm.space') // filter all newly created events
        .filter(room => room.name.charAt(0) !== 'x') // filter rooms that were deleted
      )
      const filterDepricatedEvents = eventSpace?.filter(room => room.room_type === 'm.space').filter((room, i) => i > 0) // as always, first space is the space itself therefore we filter it
      const eventSummary = await Promise.all(filterDepricatedEvents.map(room => matrixClient.getSpaceSummary(room.room_id, 0).catch(err => console.log(err)))) // then we fetch the summary of all spaces within the event space
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
                index={events?.length + i + 1}
                reloadSpace={reloadSpace}
              />
            </div>
          </div>
        )
      })}
      {eventContent?.length < 1 && _.isArray(eventSpace) &&
        <AddEvent
          length={eventSpace?.filter(space => space.room_type === 'm.space').length}
          room_id={projectSpace}
          t={t}
          allocation={allocation}
          reloadSpace={reloadSpace}
          inviteCollaborators={inviteCollaborators}
        />}
    </>
  )
}
export default DateAndVenue
