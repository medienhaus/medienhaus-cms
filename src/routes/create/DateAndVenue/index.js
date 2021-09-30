import React, { useCallback, useEffect, useState } from 'react'
import AddEvent from './components/AddEvent'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../../components/loading'
import DisplayContent from '../DisplayContent'

import DeleteButton from '../components/DeleteButton'
import deleteContentBlock from '../functions/deleteContentBlock'
import DisplayEvents from './components/DisplayEvents'
import { isArray } from 'lodash'

const DateAndVenue = ({ reloadSpace, projectSpace, events, matrixClient }) => {
  const [eventSpace, setEventSpace] = useState(events)
  const [eventContent, setEventContent] = useState([])
  const [oldEvents, setOldEvents] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [feedback, setFeedback] = useState('Migrating to new Event Space')
  const { t } = useTranslation('date')

  const createEventSpace = useCallback(async () => {
    if (!creatingRoom) {
      setCreatingRoom(true)
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
            setEventSpace(eventSummary.rooms)
            setFeedback('')
          })
      } catch (err) {
        console.log(err)
      } finally {
        setCreatingRoom(false)
      }
    }
  }, [creatingRoom, matrixClient, projectSpace])

  useEffect(() => {
    const fetchEvents = async () => {
      setOldEvents(eventSpace?.filter((room, i) => i > 0) // ignore the first element since its the space itself
        .filter(room => room.room_type !== 'm.space') // filter all newly created events
        .filter(room => room.name.charAt(0) !== 'x') // filter rooms that were deleted
      )
      const filterDepricatedEvents = eventSpace?.filter(room => room.room_type === 'm.space').filter((room, i) => i > 0) // as always, first space is the space itself therefore we filter it
      const eventSummary = await Promise.all(filterDepricatedEvents.map(room => matrixClient.getSpaceSummary(room.room_id, 0).catch(err => console.log(err)))) // then we fetch the summary of all spaces within the event space
      const onlyEvents = eventSummary
        ?.filter(room => room !== undefined) // we filter undefined results. DOM seems to be rendering to quickly here. better solution needed
        .map(event => event?.rooms.filter(room => room.room_type !== 'm.space')) // finally we remove any spaces in here since we only want the content room
      setEventContent(onlyEvents)
    }
    if (eventSpace === 'depricated') createEventSpace()
    else if (isArray(eventSpace))fetchEvents(events)
  }, [createEventSpace, eventSpace, events, matrixClient, projectSpace])

  useEffect(() => {
    setEventSpace(events)
  }, [events])

  const onDelete = async (e, roomId, name, index) => {
    e.preventDefault()
    setDeleting(true)
    try {
      console.log(roomId, name, index)
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

  if (!eventSpace) return <Loading />
  if (eventSpace === 'depricated') return <><p>{feedback}</p><Loading /></>
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
              {event.filter(room => room.name.charAt(0) !== 'x') // filter rooms that were deleted
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
                onDelete={onDelete}
                block={event}
                index={oldEvents.length + i + 1}
                reloadSpace={reloadSpace}
              />
            </div>
          </div>
        )
      }))}
      <AddEvent
        length={eventSpace.filter(space => space.room_type === 'm.space').length}
        room_id={eventSpace[0].room_id}
        t={t}
        reloadSpace={reloadSpace}
      />
    </>
  )
}
export default DateAndVenue
