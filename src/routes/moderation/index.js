import React, { useEffect, useState } from 'react'
import Requests from './Requests'
import { Loading } from '../../components/loading'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Matrix from '../../Matrix'
import { useTranslation } from 'react-i18next'

const Moderation = () => {
  const { joinedSpaces, spacesErr, fetchSpaces } = useJoinedSpaces(false)
  const [moderationRooms, setModerationRooms] = useState()
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation()

  useEffect(() => {
    if (joinedSpaces) {
      const filteredRooms = joinedSpaces.filter(space => space.meta.type === 'context')
      setModerationRooms(filteredRooms)
    }
  }, [joinedSpaces])

  const GetRequestPerRoom = ({ request }) => {
    const room = matrixClient.getRoom(request.room_id)
    // console.log(Object.values(room.currentState.members))
    const knockingUsers = Object.values(room?.currentState.members).filter(user => user.membership === 'knock')

    if (knockingUsers.length < 1) return <p>{t('No requests at the moment.')}</p>

    return knockingUsers.map((user, index) => {
      return <Requests roomId={request.room_id} roomName={request.name} userId={user.user.userId} userName={user.name} key={index} />
    })
  }

  if (fetchSpaces || !matrixClient.isInitialSyncComplete()) return <Loading />
  if (spacesErr) return <p>{spacesErr}</p>
  return (
    <div>
      {moderationRooms.length > 0
        ? moderationRooms.map((request, index) => <GetRequestPerRoom request={request} key={index} />)
        : (
          <div>
            {t('Looks like you are not moderating any spaces.')}
          </div>
          )}
    </div>
  )
}

export default Moderation
