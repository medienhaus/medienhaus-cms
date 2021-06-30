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
  const { joinedSpaces, spacesErr, fetchSpaces, reload } = useJoinedSpaces(() => console.log(fetchSpaces || spacesErr))
  const matrixClient = Matrix.getMatrixClient()
  const [drafts, setDrafts] = useState([]);
  const [publish, setPublish] = useState([]);
  const [invites, setInvites] = useState([])

  useEffect(() => {

    const getSync = async () => {
      try {
        await matrixClient.startClient().then(async () => {
          // console.log(await matrixClient.publicRooms());
          matrixClient.on('Room', (room) => {
            setTimeout(async () => {
              if (room.getMyMembership() === 'invite') {
                console.log(room)
                const isRoomEmpty = await room._loadMembersFromServer()
                isRoomEmpty.length > 1 && room.getType() === 'm.space' && setInvites(invites => invites.concat({ name: room.name, id: room.roomId, membership: room._selfMembership }))
              }

            }, 0)
          }
          )
        })
      } catch (e) {
        console.log(e)
      }
    }
    getSync()
    // eslint-disable-next-line 
  }, [])

  useEffect(() => {
    setDrafts(joinedSpaces?.filter(x => x.published === 'invite'))
    setPublish(joinedSpaces?.filter(x => x.published === 'public'))
  }, [joinedSpaces]);


  const reloadInvites = (index) => {
    setInvites(invites => invites.filter((invite, i) => i !== index))
  }

  const onRedact = (index, space) => {
    space.published = 'invite'
    setPublish(publish => publish.filter((draft, i) => i !== index))
    setDrafts(drafts => [...drafts, space])
    console.log(publish);
    console.log(drafts);
  }

  const onPublish = (index, space) => {
    space.published = 'public'
    setDrafts(drafts => drafts.filter((draft, i) => i !== index))
    setPublish(publish => [...publish, space])
    console.log(publish);
    console.log(drafts);
  }

  return (
    <div>
      <p>Hello <strong>{profile.displayname}</strong>,</p>
      <p>welcome to your profile for the Rundgang 2021.</p>
      {!invites ? <Loading /> : invites.length > 0 && (
        <>
          <p>You have been invited to join the following project{invites.length > 1 && 's'}:</p>
          <ul>
            {invites.map((room, index) => <Invites room={room} index={index} callback={reloadInvites} />)}
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
              {spacesErr ? console.error(spacesErr) : drafts.map((space, index) => <><Projects space={space} visibility={space.visibility} index={index} reloadProjects={onPublish} /><hr /></>)
              }
            </ul>
            {publish?.length > 0 && <p>You have <strong>{publish.length} published</strong> project{publish.length > 1 && 's'}, which {publish.length > 1 ? 'are' : 'is'} publicly visible.</p>}
            <ul>
              {spacesErr ? console.error(spacesErr) : publish.map((space, index) => <><Projects space={space} visibility={space.published} index={index} reloadProjects={onRedact} /><hr /> </>)
              }
            </ul>
          </>
        )}
    </div>
  )
}

export default Profile
