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
  const [invites, setInvites] = useState({})

  // @TODO: Check for existing invites on page load

  // Listen for room events to populate our "pending invites" state
  useEffect(() => {
    async function handleRoomEvent(room) {
      // Ignore event if this is not about a space
      if (room.getType() !== 'm.space') return

      const roomMembers = await room._loadMembersFromServer().catch(console.error)
      // room.getMyMembership() is only available after the current call stack has cleared (_.defer),
      // so we put it behind the "await"
      if (room.getMyMembership() !== 'invite' || roomMembers.length < 1) {
        return
      }

      setInvites(invites => Object.assign({}, invites, {
        [room.roomId]:
          {
            name: room.name,
            id: room.roomId,
            membership: room._selfMembership
          }
      }))
    }
    matrixClient.on('Room', handleRoomEvent)

    // When navigating away from /profile we want to stop listening for those room events again
    return () => {
      matrixClient.removeListener('Room', handleRoomEvent)
    }
  })

  useEffect(() => {
    setDrafts(joinedSpaces?.filter(projectSpace => projectSpace.published === 'invite'))
    setPublications(joinedSpaces?.filter(projectSpace => projectSpace.published === 'public'))
  }, [joinedSpaces]);


  const removeInviteByIndex = (index) => {
    // @TODO: This function is currently not being used. But needs to be refactored to take the room ID as index.
    // setInvites(invites => invites.filter((invite, i) => i !== index))
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
      {!invites ? <Loading /> : Object.keys(invites).length > 0 && (
        <>
          <p>You have been invited to join the following project{invites.length > 1 && 's'}:</p>
          <ul>
            {Object.values(invites).map((room, index) => (
              <li key={index}>
                <Invites room={room} callback={() => { removeInviteByIndex(room) }} />
              </li>
            ))}
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
