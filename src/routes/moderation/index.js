import React, { useEffect, useState } from 'react'
import Requests from './Requests'
import { Loading } from '../../components/loading'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Matrix from '../../Matrix'
import { useTranslation } from 'react-i18next'
import LoadingSpinnerButton from '../../components/LoadingSpinnerButton'
import config from '../../config.json'
import promote from '../../components/matrix_promote'

const Moderation = () => {
  const { joinedSpaces, spacesErr, fetchSpaces } = useJoinedSpaces(false)
  const [moderationRooms, setModerationRooms] = useState()
  const [admin, setAdmin] = useState(false)

  const [selectedRoom, setSelectedRoom] = useState(false)
  const [userToInvite, setUserToInvite] = useState('')
  const [userSearch, setUserSearch] = useState([])
  const [fetching, setFetching] = useState(false)
  const [inviteFeedback, setInviteFeedback] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation()

  useEffect(() => {
    if (joinedSpaces) {
      const filteredRooms = joinedSpaces.filter(space => space.meta.type === 'context')
      setModerationRooms(filteredRooms)

      // check admin priviliges
      const powerLevel = async () => {
        try {
          const getPagesLevel = await matrixClient.getStateEvent(config.rootId, 'm.room.power_levels')
          getPagesLevel.users[localStorage.getItem('mx_user_id')] === 100 && setAdmin(true)
        } catch (err) {
          console.error(err)
        }
      }
      powerLevel()
    }
  }, [joinedSpaces, matrixClient])

  useEffect(() => {
  }, [userToInvite])
  const GetRequestPerRoom = ({ request }) => {
    const room = matrixClient.getRoom(request.room_id)
    // console.log(Object.values(room.currentState.members))
    const knockingUsers = Object.values(room?.currentState.members).filter(user => user.membership === 'invite')
    // @TODO change back to knock when context is done

    if (knockingUsers.length < 1) return <p>{t('No requests at the moment.')}</p>

    return knockingUsers.map((user, index) => {
      return <Requests roomId={request.room_id} roomName={request.name} userId={user.user.userId} userName={user.name} key={index} />
    })
  }

  const fetchUsers = async (e, search) => {
    e.preventDefault()
    setFetching(true)
    try {
      const users = await matrixClient.searchUserDirectory({ term: search })
      // we only update the state if the returned array has entries, to be able to check if users a matrix users or not further down in the code (otherwise the array gets set to [] as soon as you selected an option from the datalist)
      users.results.length > 0 && setUserSearch(users.results)
    } catch (err) {
      console.error('Error while trying to fetch users: ' + err)
    } finally {
      setFetching(false)
    }
  }

  const invite = async () => {
    const id = userToInvite.substring(userToInvite.lastIndexOf(' ') + 1)
    const name = userToInvite.substring(0, userToInvite.lastIndexOf(' '))
    if (id !== localStorage.getItem('mx_user_id')) {
      await matrixClient.invite(moderationRooms[0].room_id, id)
      setInviteFeedback('invited' + name + ' successfully')
      selectedRoom === (config.rootId || config.peagesId) && promote(id, selectedRoom, 100)
      setTimeout(() => {
        setInviteFeedback('')
        setUserToInvite('')
      }, 2000)
    }
  }

  if (fetchSpaces || !matrixClient.isInitialSyncComplete()) return <Loading />
  if (spacesErr) return <p>{spacesErr}</p>
  return (
    <>
      {moderationRooms.length > 0
        ? <>
          <section className="requests">
            <h3>{t('Requests')}</h3>
            {moderationRooms.map((request, index) => <GetRequestPerRoom request={request} key={index} />)}
          </section>
          <section className="invite">
            <h3>{t('Invite')}</h3>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
              <option value={false} disabled>-- {t('SELECT')} --</option>
              {admin &&
                <>
                  <option value={false} disabled>-- {t('Promote to admin')} --</option>
                  <option value={config.rootId}>medienhaus-cms (Admin)</option>
                  <option value={config.pagesId}>pages (Admin)</option>
                </>}
              <option value={false} disabled>-- {t('Context')} --</option>
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
            <LoadingSpinnerButton disabled={fetching || inviteFeedback || !selectedRoom} onClick={invite}>{t('INVITE')}</LoadingSpinnerButton>
            {inviteFeedback &&
              <p>{inviteFeedback}</p>}
          </section>
          {/* eslint-disable-next-line react/jsx-closing-tag-location */}
        </>
        : (
          <div>
            {t('Looks like you are not moderating any spaces.')}
          </div>
          )}
    </>
  )
}

export default Moderation
