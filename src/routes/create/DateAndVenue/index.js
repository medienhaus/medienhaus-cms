import React, { useEffect, useState } from 'react'
import AddLocation from '../AddContent/AddLocation'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../../components/loading'
import DisplayContent from '../DisplayContent'

const DateAndVenue = ({ reloadSpace, projectSpace, events, matrixClient }) => {
  const [eventSpace, setEventSpace] = useState(events)
  const [eventContent, setEventContent] = useState([])
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
      const filterDepricatedEvents = eventSpace.filter(room => room.room_type === 'm.space').filter((room, i) => i > 0) // as always, first space is the space itself therefore we filter it
      const eventSummary = await Promise.all(filterDepricatedEvents.map(room => matrixClient.getSpaceSummary(room.room_id, 0).catch(err => console.log(err)))) // then we fetch the summary of all spaces within the event space
      const onlyEvents = eventSummary.map(event => event.rooms.filter(room => room.room_type !== 'm.space')) // finally we remove any spaces in here since we only want the content room
      setEventContent(onlyEvents)
    }
    setEventSpace(events)
    events === 'depricated'
      ? createEventSpace()
      : eventSpace && fetchEvents(events)
  }, [eventSpace, events, matrixClient, projectSpace])

  const Events = () => {
    const oldEvents = eventSpace.filter((room, i) => i > 0) // ignore the first element since its the space itself
      .filter(room => room.name.charAt(0) !== 'x') // filter rooms that were deleted

    return (
      <>
        {oldEvents
          .filter(room => room.room_type !== 'm.space') // filter all newly created events
          .map((event, i) => {
            return <DisplayContent block={event} index={i} blocks={eventSpace} projectSpace={eventSpace} reloadSpace={reloadSpace} key={event + i} mapComponent />
          })}
        {eventContent.map(event => {
          return (
            <React.Fragment key={event}>
              <div>{
              event.filter(room => room.name.charAt(0) !== 'x') // filter rooms that were deleted
                .map((event, i) => {
                  return <DisplayContent block={event} index={i} blocks={eventSpace} projectSpace={eventSpace} reloadSpace={reloadSpace} key={event + i} mapComponent />
                })
}</div>
              <div className="right">
                <button>
                  ×
                </button>
              </div>
            </React.Fragment>
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
