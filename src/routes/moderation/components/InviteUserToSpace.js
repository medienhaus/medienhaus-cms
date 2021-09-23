import React, { useState } from 'react'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'

const InviteUserToSpace = ({ matrixClient, moderationRooms, setPower, fetchUsers, fetching, userSearch }) => {
  const [promoteToModerator, setPromoteToModerator] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(false)
  const [userToInvite, setUserToInvite] = useState('')
  const [inviteFeedback, setInviteFeedback] = useState('')
  const { t } = useTranslation()

  const invite = async () => {
    // @TODO check why userToInvite is not cleared
    const id = userToInvite.substring(userToInvite.lastIndexOf(' ') + 1)
    const name = userToInvite.substring(0, userToInvite.lastIndexOf(' '))
    if (id !== localStorage.getItem('mx_user_id')) {
      try {
        await matrixClient.invite(selectedRoom, id)
        promoteToModerator && setPower(selectedRoom, id, 50)
        setInviteFeedback('invited ' + name + ' successfully')
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
