import React, { useState } from 'react'
import { MatrixEvent } from 'matrix-js-sdk'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'

const InviteUserToSpace = ({ matrixClient, moderationRooms }) => {
  const [promoteToModerator, setPromoteToModerator] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(false)
  const [userToInvite, setUserToInvite] = useState('')
  const [userSearch, setUserSearch] = useState([])
  const [fetching, setFetching] = useState(false)
  const [inviteFeedback, setInviteFeedback] = useState('')
  const { t } = useTranslation()

  const fetchUsers = async (e, search) => {
    e.preventDefault()
    setFetching(true)
    try {
      const users = await matrixClient.searchUserDirectory({ term: search })
      // we only update the state if the returned array has entries, to be able to check if users a matrix users or not further down in the code (otherwise the array gets set to [] as soon as you selected an option from the datalist)
      users.results.length > 0 && setUserSearch(users.results)
    } catch (err) {
      console.error('Error whhile trying to fetch users: ' + err)
    } finally {
      setFetching(false)
    }
  }

  const setPower = async (roomId, userId, level) => {
    console.log('changing power level for ' + userId)
    matrixClient.getStateEvent(roomId, 'm.room.power_levels', '').then(async (res) => {
      const powerEvent = new MatrixEvent({
        type: 'm.room.power_levels',
        content: res
      }
      )
      try {
        // something here is going wrong for collab > 2
        await matrixClient.setPowerLevel(roomId, userId, level, powerEvent)
      } catch (err) {
        console.error(err)
      }
    })
  }
  const invite = async () => {
    // @TODO check why userToInvite is not cleared
    const id = userToInvite.substring(userToInvite.lastIndexOf(' ') + 1)
    const name = userToInvite.substring(0, userToInvite.lastIndexOf(' '))
    if (id !== localStorage.getItem('mx_user_id')) {
      try {
        await matrixClient.invite(selectedRoom, id)
        promoteToModerator && setPower(selectedRoom, id, 50)
        setInviteFeedback('invited' + name + ' successfully')
        setTimeout(() => {
          setInviteFeedback('')
          setUserToInvite('')
        }, 2000)
      } catch (err) {
        setInviteFeedback(err.data.error)
        setTimeout(() => {
          setInviteFeedback('')
        }, 2000)
      }
    }
  }

  return (
    <section className="invite">
      <h3>{t('Invite students')}</h3>
      <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
        <option value={false} disabled>-- {t('select context')} --</option>
        {moderationRooms.map((room, index) => <option key={index} value={room.room_id}>{room.name}</option>)}
      </select>
      <input
        list="userSearch"
        id="user-datalist"
        name="user-datalist"
        placeholder={t('name')}
        onChange={(e) => {
          fetchUsers(e, e.target.value)
        }}
        onBlur={(e) => {
          setUserToInvite(e.target.value)
        }}
      />
      <datalist id="userSearch">
        {userSearch.map((users, i) => {
          return <option key={i} value={users.display_name + ' ' + users.user_id} />
        })}
      </datalist>
      <select value={promoteToModerator} onChange={(event) => { setPromoteToModerator(event.target.value === 'true') }}>
        <option value="false">🚫 {t('CANNOT moderate the context')}</option>
        <option value="true">⚠️ {t('CAN moderate the context')}</option>
      </select>
      <LoadingSpinnerButton disabled={fetching || inviteFeedback || !selectedRoom} onClick={invite}>{t('INVITE')}</LoadingSpinnerButton>
      {inviteFeedback &&
        <p>{inviteFeedback}</p>}
    </section>
  )
}
export default InviteUserToSpace
