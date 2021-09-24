import React, { useEffect, useState } from 'react'
import AddLocation from '../AddContent/AddLocation'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../../components/loading'
import DisplayContent from '../DisplayContent'

const DateAndVenue = ({ reloadSpace, projectSpace, events, matrixClient }) => {
  const [eventSpace, setEventSpace] = useState(events)
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
        const events = await matrixClient.createRoom(opts('events', 'events'))
          .then(async (res) => {
            setFeedback('Event space created. Now adding to parent Space')
            console.log(projectSpace)
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
            const eventSummary = await matrixClient.getSpaceSummary(res).catch(err => console.log(err))
            setEventSpace(eventSummary)
          })
        console.log(events)
      } catch (err) {
        console.log(err)
      }
    }
    setEventSpace(events)
    events === 'depricated' && createEventSpace()
  }, [events, matrixClient, projectSpace])

  const Events = () => {
    return eventSpace.filter((element, i) => i > 0).map((event, i) => {
      return <DisplayContent block={event} index={i} blocks={eventSpace} projectSpace={eventSpace} reloadSpace={reloadSpace} key={event + i} mapComponent />
    })
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
