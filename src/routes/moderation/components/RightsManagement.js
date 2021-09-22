import React, { useState } from 'react'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'

const RightsManagement = ({ matrixClient, moderationRooms, setPower, fetchUsers, fetching, userSearch }) => {
  const [selectedRoom, setSelectedRoom] = useState('')
  const [userToPromote, setUserToPromote] = useState('')
  const [promoteFeedback, setPromoteFeedback] = useState('')
  const { t } = useTranslation()

  const promote = async () => {
    const res = await setPower(selectedRoom, userToPromote, 50)
    console.log(res)
    res.event_id && setPromoteFeedback(t('Succesfully promoted user to moderator'))

    setTimeout(() => {
      setPromoteFeedback('')
      setUserToPromote('')
      setSelectedRoom('')
    }, 2000)
  }
  const onError = (err) => {
    setPromoteFeedback(err.data.error)

    setTimeout(() => {
      setPromoteFeedback('')
    }, 2000)
  }
  const checkIfUserIsInRoom = (id, name) => {
    if (!selectedRoom) return
    const room = matrixClient.getRoom(selectedRoom)
    id in room.currentState.members
      ? setPromoteFeedback('')
      : setPromoteFeedback(name + t(' is not a member of this space. Please invite them first.'))
  }

  return (
    <section className="promote">
      <h3>{t('Promote users to moderator')}</h3>
      <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
        <option value="" disabled>-- {t('select context')} --</option>
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
          setUserToPromote(e.target.value.substring(e.target.value.lastIndexOf(' ') + 1))
          checkIfUserIsInRoom(e.target.value.substring(e.target.value.lastIndexOf(' ') + 1), e.target.value.substring(0, e.target.value.lastIndexOf(' ')))
        }}
      />
      <datalist id="userSearch">
        {userSearch.map((users, i) => {
          return <option key={i} value={users.display_name + ' ' + users.user_id} />
        })}
      </datalist>
      <LoadingSpinnerButton disabled={fetching || promoteFeedback || !selectedRoom} onClick={promote} onError={onError}>{t('PROMOTE TO MODERATOR')}</LoadingSpinnerButton>
      {promoteFeedback &&
        <p>{promoteFeedback}</p>}
    </section>
  )
}
export default RightsManagement
