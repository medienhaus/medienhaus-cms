import React, { useEffect, useState } from 'react'
import Requests from './Requests'
import { Loading } from '../../components/loading'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Matrix from '../../Matrix'
import { useTranslation } from 'react-i18next'
import LoadingSpinnerButton from '../../components/LoadingSpinnerButton'

const Moderation = () => {
  const { joinedSpaces, spacesErr, fetchSpaces } = useJoinedSpaces(false)
  const [moderationRooms, setModerationRooms] = useState()
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
    }
  }, [joinedSpaces])

  useEffect(() => {
    console.log(userToInvite)
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
      console.error('Error whhile trying to fetch users: ' + err)
    } finally {
      setFetching(false)
    }
  }

  const invite = () => {
    const id = userToInvite.substring(userToInvite.lastIndexOf(' ') + 1)
    const name = userToInvite.substring(0, userToInvite.lastIndexOf(' '))
    if (id !== localStorage.getItem('mx_user_id')) {
      matrixClient.invite(id, moderationRooms[0].room_id)
      setInviteFeedback('invited' + { name } + ' successfully')
      setTimeout(() => {
        setInviteFeedback('')
        setUserToInvite('')
      })
    }
  }

  if (fetchSpaces || !matrixClient.isInitialSyncComplete()) return <Loading />
  if (spacesErr) return <p>{spacesErr}</p>
  return (
    <div>
      {moderationRooms.length > 0
        ? <>
          {moderationRooms.map((request, index) => <GetRequestPerRoom request={request} key={index} />)}
          <div>
            <div>
              <input
                list="userSearch"
                id="user-datalist"
                name="user-datalist"
                placeholder={t('name')}
                onChange={(e) => {
                  fetchUsers(e, e.target.value)
                }}
                onClick={(e) => {
                  setUserToInvite(e.target.value)
                }}
              />
            </div>
            <datalist id="userSearch">
              {userSearch.map((users, i) => {
                return <option key={i} value={users.display_name + ' ' + users.user_id} />
              })}
            </datalist>
          </div>
          <div className="confirmation">
            <button className="cancel" disabled onClick={() => console.log('caneling')}>{t('CANCEL')}</button>
            <LoadingSpinnerButton disabled={fetching} onClick={invite}>{t('INVITE')}
            </LoadingSpinnerButton>
          </div>
          {inviteFeedback &&
            <p>{inviteFeedback}</p>}
        </>
        : (
          <div>
            {t('Looks like you are not moderating any spaces.')}
          </div>
          )}
    </div>
  )
}

export default Moderation
