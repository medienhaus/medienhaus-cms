import React, { useEffect, useState } from 'react'
import { useAuth } from '../../Auth'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Projects from './Projects'
import Invites from './Invites'
import Matrix from '../../Matrix'
import { Loading } from '../../components/loading'

const Profile = () => {
  const auth = useAuth()
  const profile = auth.user
  const { joinedSpaces, spacesErr, fetchSpaces } = useJoinedSpaces(() => console.log(fetchSpaces || spacesErr))
  const matrixClient = Matrix.getMatrixClient()
  const [drafts, setDrafts] = useState([]);
  const [publications, setPublications] = useState([]);
  const [invites, setInvites] = useState([])

  // Problematic: This event listener needs to be unset when navigating away from the profile page
  matrixClient.on('Room', async (room) => {
    if (room.getMyMembership() === 'invite') {
      console.log(room)
      const isRoomEmpty = await room._loadMembersFromServer()
      isRoomEmpty.length > 1 && room.getType() === 'm.space' && setInvites(invites => invites.concat({
        name: room.name,
        id: room.roomId,
        membership: room._selfMembership
      }))
    }
  })

  useEffect(() => {
    setDrafts(joinedSpaces?.filter(projectSpace => projectSpace.published === 'invite'))
    setPublications(joinedSpaces?.filter(projectSpace => projectSpace.published === 'public'))
  }, [joinedSpaces]);


  const removeInviteByIndex = (index) => {
    setInvites(invites => invites.filter((invite, i) => i !== index))
  }

  const changePublicationToDraft = (index, space, redact) => {
    if (!redact) {
      // if the callback is not from deleting a project we add the object to the drafts array
      space.published = 'invite'
      setDrafts(drafts => [...drafts, space])
    }
    setPublications(publications => publications.filter((draft, i) => i !== index))
  }

  const changeDraftToPublication = (index, space, redact) => {
    if (!redact) {
      space.published = 'public'
      setPublications(publications => [...publications, space])
    }
    setDrafts(drafts => drafts.filter((draft, i) => i !== index))
  }

  return (
    <div>
      <p>Hello <strong>{profile.displayname}</strong>,</p>
      <p>welcome to your profile for the Rundgang 2021.</p>
      {!invites ? <Loading /> : invites.length > 0 && (
        <>
          <p>You have been invited to join the following project{invites.length > 1 && 's'}:</p>
          <ul>
            {invites.map((room, index) => <Invites room={room} index={index} callback={removeInviteByIndex} />)}
          </ul>
        </>
      )
      }
      {fetchSpaces
        ? <Loading />
        : (
          <>
            {drafts?.length > 0 && <p>You have <strong>{drafts.length} draft{drafts.length > 1 && 's'}</strong>, which {drafts.length > 1 ? 'are' : 'is'} not publicly visible.</p>}
            <ul>
              {spacesErr ? console.error(spacesErr) : drafts.map((space, index) => <><Projects space={space} visibility={space.visibility} index={index} reloadProjects={changeDraftToPublication} /><hr /></>)
              }
            </ul>
            {publications?.length > 0 && <p>You have <strong>{publications.length} published</strong> project{publications.length > 1 && 's'}, which {publications.length > 1 ? 'are' : 'is'} publicly visible.</p>}
            <ul>
              {spacesErr ? console.error(spacesErr) : publications.map((space, index) => <><Projects space={space} visibility={space.published} index={index} reloadProjects={changePublicationToDraft} /><hr /> </>)
              }
            </ul>
          </>
        )}
    </div>
  )
}

export default Profile
