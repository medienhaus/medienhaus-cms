import React, { useState } from 'react'
import AddDate from '../addDate'
import AddLocation from '../AddContent/AddLocation'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../../components/loading'

const DateAndVenue = ({ reloadSpace, projectSpace, events, matrixClient }) => {
  const [eventSpace, setEventSpace] = useState(events)
  const [isAddLocationVisible, setIsAddLocationVisible] = useState(false)
  const [isAddDateVisible, setIsAddDateVisible] = useState(false)
  const { t } = useTranslation('date')
  console.log(events)
  console.log(eventSpace)
  const MigrateToEventSpace = () => {
    const [feedback, setFeedback] = useState('Migrating to new Event Space')
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
              version: '0.1',
              rundgang: 21,
              type: type,
              present: 'analog'
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
    events === 'depricated' && createEventSpace()
    return (
      <>
        <p>{feedback}</p>
        <Loading />
      </>
    )
  }

  const Events = () => {
    return eventSpace.map(event => {
      return <p key={event.name}>yay events</p>
    })
  }

  if (!eventSpace) return <Loading />
  if (eventSpace === 'depricated') return <MigrateToEventSpace />

  return (
    <>
      {eventSpace?.length > 1 && <Events />}
      <div className="add">
        <button className="add-button" onClick={(e) => { e.preventDefault(); setIsAddLocationVisible(!isAddLocationVisible) }}>+ {t('Location')}</button>
      </div>
      {isAddLocationVisible && <AddLocation onBlockWasAddedSuccessfully={reloadSpace} callback={() => setIsAddLocationVisible(false)} />}
      <div className="add">
        <button className="add-button" onClick={(e) => { e.preventDefault(); setIsAddDateVisible(!isAddDateVisible) }}>+ {t('Date')}</button>
      </div>
      {isAddDateVisible && <AddDate reloadSpace={reloadSpace} projectSpace={eventSpace[0].room_id} />}
    </>
  )
}
export default DateAndVenue
