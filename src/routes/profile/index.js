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
  const drafts = joinedSpaces?.filter(x => x.published === "invite")
  const publish = joinedSpaces?.filter(x => x.published === "public")
  const [invites, setInvites] = useState([]);

  useEffect(() => {

    const getSync = async () => {
      try {
        await matrixClient.startClient().then(() => {
          matrixClient.on("Room", (room) => {
            setTimeout(async () => {
              room._selfMembership === 'invite' && console.log(room);
              room._selfMembership === 'invite' && setInvites(invites => invites.concat({ "name": room.name, "id": room.roomId, "membership": room._selfMembership }))
            }, 0)
          }
          )
        })
      } catch (e) {
        console.log(e)
      }
    }
    getSync();
  }, []);

  const reloadProjects = () => {
    reload()
};
  
  return (
    <div>
      <p>Hello <strong>{profile.displayname}</strong>,</p>
      <p>welcome to your profile for the Rundgang 2021.</p>
      {invites.length > 0 && (
      <>
        <p>You have been invited to join the following project{invites.length > 1 && 's'}:</p>
      <ul>
            {invites.map((room) => <Invites room={room}/>)}
            </ul>
            </>
        ) 
            }
      {fetchSpaces ? <Loading /> : (
         <>
          {drafts?.length > 0 && <p>You have <strong>{drafts.length} draft{drafts.length > 1 && 's' }</strong>, which {drafts.length > 1 ? 'are' : 'is'  } not publicly visible.</p>}
       <ul>
           {spacesErr ? console.error(spacesErr) : drafts.map((space, index) =>  <><Projects space = { space } visibility={ space.visibility } reloadProjects={reloadProjects} /><hr /></>) 
          }
          </ul>
          {publish?.length > 0 && <p>You have <strong>{publish.length} published</strong> project{publish.length > 1 && 's'}, which {publish.length > 1 ? 'are' : 'is'  } publicly visible.</p>}
          <ul>
            {spacesErr ? console.error(spacesErr) : publish.map((space, index) => <><Projects space = { space } visibility={ space.published } reloadProjects={reloadProjects} /><hr /> </>) 
              }
            </ul>
          </>
      )}
    </div>
  )
}

export default Profile
