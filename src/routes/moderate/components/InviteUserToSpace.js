import React, { useState } from 'react'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../../components/loading'
import SimpleContextSelect from '../../../components/SimpleContextSelect'

const InviteUserToSpace = ({ matrixClient, nestedRooms, setPower, fetchUsers, fetching, userSearch }) => {
  const [promoteToModerator, setPromoteToModerator] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState('')
  const [userToInvite, setUserToInvite] = useState('')
  const [inviteFeedback, setInviteFeedback] = useState('')
  const { t } = useTranslation('moderate')

  const invite = async () => {
    // @TODO check why userToInvite is not cleared
    const id = userToInvite.substring(userToInvite.lastIndexOf(' ') + 1)
    const name = userToInvite.substring(0, userToInvite.lastIndexOf(' '))
    if (id !== localStorage.getItem('mx_user_id')) {
      try {
        await matrixClient.invite(selectedRoom, id)
        promoteToModerator && setPower(selectedRoom, id, 50)
        setInviteFeedback(name + t(' was successfully invited'))
        setTimeout(() => {
          setInviteFeedback('')
          setUserToInvite('')
        }, 2000)
      } catch (err) {
        if (promoteToModerator && err.data.error.includes('is already in the room')) {
          // if the user is already in the room but not moderating yet, we promote them to moderator
          setPower(selectedRoom, id, 50)
          setInviteFeedback('Promoted ' + id + 'to moderator')
        } else {
          setInviteFeedback(err.data.error)
        }
        setTimeout(() => {
          setInviteFeedback('')
        }, 2000)
      }
    }
  }

  return (
    <section className="invite">
      <h3>{t('Invite accounts')}</h3>
      <p>{t('Invite accounts to specific contexts, and optionally promote them to moderate that specific context they are invited to.')}</p>
      {!nestedRooms
        ? <Loading />
        : <SimpleContextSelect
            onItemChosen={setSelectedRoom}
            selectedContext={selectedRoom}
            struktur={nestedRooms}
            preSelectedValue="context"
          />}
      <input
        list="userSearch"
        id="user-datalist"
        name="user-datalist"
        placeholder={t('account_id')}
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
