import React, { useEffect, useState } from 'react'
import Requests from './components/Requests'
import { Loading } from '../../components/loading'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Matrix from '../../Matrix'
import { useTranslation } from 'react-i18next'
import InviteUserToSpace from './components/InviteUserToSpace'

const Moderation = () => {
  const { joinedSpaces, spacesErr, fetchSpaces } = useJoinedSpaces(false)
  const [moderationRooms, setModerationRooms] = useState()
  const [selection, setSelection] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation()

  useEffect(() => {
    if (joinedSpaces) {
      const typeOfSpaces = ['context',
        'class',
        'course',
        'institution',
        'degree program',
        'design department',
        'faculty',
        'institute',
        'semester']
      // check to see if a user has joined a room with the specific content type and is moderator or admin (at least power level 50)
      const filteredRooms = joinedSpaces.filter(space => typeOfSpaces.includes(space.meta.type) && space.powerLevel > 49)
      setModerationRooms(filteredRooms)
    }
  }, [joinedSpaces])

  const GetRequestPerRoom = ({ request }) => {
    const room = matrixClient.getRoom(request.room_id)
    // console.log(Object.values(room.currentState.members))
    const knockingUsers = Object.values(room?.currentState.members).filter(user => user.membership === 'knock')
    // @TODO delete users from array after accepting/rejecting

    if (knockingUsers.length < 1) return <p>{t('No requests at the moment.')}</p>

    return knockingUsers.map((user, index) => {
      return <Requests roomId={request.room_id} roomName={request.name} userId={user.userId} userName={user.name} matrixClient={matrixClient} key={index} />
    })
  }

  const RightsManagement = () => {
    return <div>Hello</div>
  }
  const renderSelection = () => {
    switch (selection) {
      case 'invite':
        return <InviteUserToSpace matrixClient={matrixClient} moderationRooms={moderationRooms} />
      case 'rights':
        return <RightsManagement matrixClient={matrixClient} moderationRooms={moderationRooms} />
      default:
        return (
          moderationRooms.length > 0
            ? <>

              <section className="requests">
                {moderationRooms.map((request, index) => <React.Fragment key={request.name}><h3>{request.name}</h3><GetRequestPerRoom request={request} key={index} /></React.Fragment>)}
              </section>
              {/* eslint-disable-next-line react/jsx-closing-tag-location */}
            </>
            : (
              <div>
                {t('Looks like you are not moderating any spaces.')}
              </div>
              )
        )
    }
  }

  if (fetchSpaces || !matrixClient.isInitialSyncComplete()) return <Loading />
  if (spacesErr) return <p>{spacesErr}</p>
  return (
    <>
      <section className="request">
        <div id="formchooser">
          <input type="radio" id="add-user" name={t('Add Account')} checked={selection === ''} onChange={() => setSelection('')} />
          <label htmlFor="add-user">{t('Add Account')}</label>
          <input type="radio" id="invite-users" name={t('Invite Users')} value="invite-user" checked={selection === 'invite'} onChange={() => setSelection('invite')} />
          <label htmlFor="invite-users-invite-users">{t('Invite Users')}</label>
          <input type="radio" id="rights-management" name={t('Promote Users')} value="rights-management" checked={selection === 'rights'} onChange={() => setSelection('rights')} />
          <label htmlFor="rights-management">{t('Promote Users')}</label>
        </div>
      </section>
      {renderSelection()}
    </>
  )
}

export default Moderation
