import React, { useEffect, useState } from 'react'
import AddLocation from '../AddContent/AddLocation'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../../components/loading'
import DisplayContent from '../DisplayContent'
import FetchCms from '../../../components/matrix_fetch_cms'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

import locations from '../../../assets/data/locations.json'
import DeleteButton from '../components/DeleteButton'
import deleteContentBlock from '../functions/deleteContentBlock'

const DateAndVenue = ({ reloadSpace, projectSpace, events, matrixClient }) => {
  const [eventSpace, setEventSpace] = useState(events)
  const [eventContent, setEventContent] = useState([])
  const [oldEvents, setOldEvents] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [isAddEventVisible, setIsAddEventVisible] = useState(false)
  const [feedback, setFeedback] = useState('Migrating to new Event Space')
  const { t } = useTranslation('date')

  useEffect(() => {
    const createEventSpace = async () => {
      const opts = (type, name) => {
        return {
          preset: 'private_chat',
          name: name,
          room_version: '7',
          creation_content: { type: 'm.space' },
          initial_state: [{
            type: 'm.room.history_visibility',
            content: { history_visibility: 'world_readable' }
          },
          {
            type: 'dev.medienhaus.meta',
            content: {
              version: '0.2',
              rundgang: 21,
              type: type
            }
          },
          {
            type: 'm.room.guest_access',
            state_key: '',
            content: { guest_access: 'can_join' }
          }],
          visibility: 'private'
        }
      }

      try {
        await matrixClient.createRoom(opts('events', 'events'))
          .then(async (res) => {
            setFeedback('Event space created. Now adding to parent Space')
            // and add those subspaces as children to the project space
            await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.space.child/${res.room_id}`, {
              method: 'PUT',
              headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
              body: JSON.stringify({
                via:
                  [process.env.REACT_APP_MATRIX_BASE_URL],
                suggested: false,
                auto_join: true
              })
            })
            setFeedback('Reloading')
            return res.room_id
          }).then(async (res) => {
            const eventSummary = await matrixClient.getSpaceSummary(res, 0).catch(err => console.log(err))
            setEventSpace(eventSummary)
          })
      } catch (err) {
        console.log(err)
      }
    }
    const fetchEvents = async () => {
      setOldEvents(eventSpace.filter((room, i) => i > 0) // ignore the first element since its the space itself
        .filter(room => room.room_type !== 'm.space') // filter all newly created events
        .filter(room => room.name.charAt(0) !== 'x') // filter rooms that were deleted
      )
      const filterDepricatedEvents = eventSpace.filter(room => room.room_type === 'm.space').filter((room, i) => i > 0) // as always, first space is the space itself therefore we filter it
      const eventSummary = await Promise.all(filterDepricatedEvents.map(room => matrixClient.getSpaceSummary(room.room_id, 0).catch(err => console.log(err)))) // then we fetch the summary of all spaces within the event space
      const onlyEvents = eventSummary
        ?.filter(room => room !== undefined) // we filter undefined results. DOM seems to be rendering to quickly here. Due to time pressure this will have to do for now.
        .map(event => event?.rooms.filter(room => room.room_type !== 'm.space')) // finally we remove any spaces in here since we only want the content room
      setEventContent(onlyEvents)
    }
    setEventSpace(events)
    events === 'depricated'
      ? createEventSpace()
      : eventSpace && fetchEvents(events)
  }, [eventSpace, events, matrixClient, projectSpace])

  const onDelete = async (e, roomId, name, index) => {
    console.log(roomId, name, index)
    e.preventDefault()
    setDeleting(true)
    try {
      await deleteContentBlock(name, roomId, index)
      // reloadSpace()
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

  const Events = () => {
    return (
      <>
        {oldEvents
          ?.map((event, i) => {
            return <DisplayContent block={event} index={i} blocks={eventSpace} projectSpace={eventSpace} reloadSpace={reloadSpace} key={event + i} mapComponent />
          })}
        {eventContent.map((event, i) => {
          return (
            <div className="editor" key={event.name}>
              <div className="left event">
                <figure className="icon-bg">🎭</figure>
              </div>
              <div className="center">{
              event.filter(room => room.name.charAt(0) !== 'x') // filter rooms that were deleted
                .map((event, i) => {
                  let { cms, error, fetching } = FetchCms(event.room_id)
                  cms = cms[0]
                  if (fetching) return <Loading />
                  if (error) return <p>{t('something went wrong.')}</p>
                  if (event.name.includes('location')) {
                    return (
                      <div
                        key={i}
                        className={cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-')) === '0.0, 0.0' && 'center'}
                      >
                        {
                          cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-')) !== '0.0, 0.0' &&
                            <MapContainer className="center" center={[cms.body.substring(0, cms.body.indexOf(',')), cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-'))]} zoom={17} scrollWheelZoom={false} placeholder>
                              <TileLayer
                                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker position={[cms.body.substring(0, cms.body.indexOf(',')), cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-'))]}>
                                <Popup>
                                  {locations.find(coord => coord.coordinates === cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.lastIndexOf('-')))?.name || // if the location is not in our location.json
                                  cms.body.substring(cms.body.lastIndexOf('-') + 1).length > 0 // we check if the custom input field was filled in
                                    ? cms.body.substring(cms.body.lastIndexOf('-') + 1) // if true, we display that text on the popup otherwise we show the lat and long coordinates
                                    : cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1)}
                                </Popup>
                              </Marker>
                            </MapContainer>
                        }
                        {cms.body.substring(cms.body.lastIndexOf('-') + 1).length > 0 && <input type="text" value={cms.body.substring(cms.body.lastIndexOf('-') + 1)} disabled />}
                      </div>
                    )
                  } else {
                    return (
                      <div className="center">
                        {cms.body.split(' ')[0] && <input type="date" value={cms.body.split(' ')[0]} disabled required />}
                        {cms.body.split(' ')[1] && <input type="time" value={cms.body.split(' ')[1]} disabled required />}
                      </div>
                    )
                  }
                })
}</div>
              <div className="right">
                <DeleteButton
                  deleting={deleting} onDelete={onDelete} block={eventSpace[oldEvents.length + i + 1]} index={oldEvents.length + i + 1} reloadSpace={reloadSpace}
                />
              </div>
            </div>
          )
        })}
      </>
    )
  }

  if (!eventSpace) return <Loading />
  if (eventSpace === 'depricated') return <><p>{feedback}</p><Loading /></>
  return (
    <>
      {eventSpace?.length > 1 && <Events />}
      {!isAddEventVisible &&
        <button
          className="add-button"
          onClick={(e) => { e.preventDefault(); setIsAddEventVisible(true) }}
        >+ {t('Add Event')}
        </button>}
      {isAddEventVisible &&
        <>
          <AddLocation
            number={eventSpace.length}
            projectSpace={eventSpace[0].room_id}
            onBlockWasAddedSuccessfully={reloadSpace}
            callback={() => setIsAddEventVisible(false)}
          />
        </>}
    </>
  )
}
export default DateAndVenue
