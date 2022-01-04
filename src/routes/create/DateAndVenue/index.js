import React, { useEffect, useState } from 'react'
import AddEvent from './components/AddEvent'
import { useTranslation } from 'react-i18next'
import DisplayContent from '../DisplayContent'

import DeleteButton from '../components/DeleteButton'
import deleteContentBlock from '../functions/deleteContentBlock'
import DisplayEvents from './components/DisplayEvents'
import { isArray } from 'lodash'
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

  const onDelete = async (e, roomId, name, index) => {
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
                onDelete={onDelete}
                block={event[0]}
                index={oldEvents.length + i + 1}
                reloadSpace={reloadSpace}
              />
            </div>
          </div>
        )
      }))}
      {allocation
        ?.map((event, i) => {
          return <DisplayContent block={event} index={i} blocks={eventSpace} projectSpace={eventSpace} reloadSpace={reloadSpace} allocationEvent={allocation} key={event + i} mapComponent />
        })}
      {eventContent?.length < 1 &&
        <AddEvent
          length={eventSpace.filter(space => space.room_type === 'm.space').length}
          room_id={eventSpace[0].room_id}
          t={t}
          reloadSpace={reloadSpace}
          inviteCollaborators={inviteCollaborators}
        />}
    </>
  )
}
export default DateAndVenue
