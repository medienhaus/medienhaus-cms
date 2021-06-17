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
  const { joinedSpaces, spacesErr, fetchSpaces } = useJoinedSpaces()
  const matrixClient = Matrix.getMatrixClient()
  const drafts = joinedSpaces?.filter(x => x.published === "invite")
  const publish = joinedSpaces?.filter(x => x.published === "public")
  const [invites, setInvites] = useState([]);


  useEffect(() => {
   
    const getSync = async () => {
      try {
        await matrixClient.startClient().then(() => {
          matrixClient.on("Room", async function (room) {
            setTimeout(async () => {
              const req = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${room.roomId}/joined_members`, {
                method: 'GET',
                headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
              })
              const members = await req.json()
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

  return (
    <div>
      <p>Hello <strong>{profile.displayname}</strong></p>
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
         {drafts && <p>You have <strong>{drafts.length}</strong> drafts, which are not publicly visible.</p>}
       <ul>
           {spacesErr ? console.error(spacesErr) : drafts.map((space, index) =>  <Projects space = { space } />) 
          }
          </ul>
          {publish && <p>You have <strong>{publish.length}</strong> published projects, which are publicly visible.</p>}
          <ul>
            {spacesErr ? console.error(spacesErr) : publish.map((space, index) => <Projects space = { space } />) 
              }
            </ul>
          </>
      )}
    </div>
  )
}

export default Profile
