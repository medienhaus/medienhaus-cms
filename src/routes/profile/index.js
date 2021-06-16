import React, { useState } from 'react'
import { useAuth } from '../../Auth'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import { Loading } from '../../components/loading'

const Profile = () => {
  const auth = useAuth()
  const profile = auth.user
  const {joinedSpaces, spacesErr, fetchSpaces} = useJoinedSpaces()


  const Drafts = () => {
    const [drafts, setDrafts] = useState([]);

    return (
      <>
      
      <ul>
          {spacesErr ? console.error(spacesErr) : joinedSpaces ? <p>You have <strong>{joinedSpaces.length}</strong> projects.</p>
            /*  <li key={index} ><button onClick={() => { setProjectSpace(space.room_id); setTitle(space.name); setVisibility(space.published) }}>{space.name}</button></li>)*/
 : null 
        }
        </ul>
        <h2>Drafts:</h2>
      </>
    )
  }

  return (
    <div>
      <p>Hello <strong>{profile.displayname}</strong></p>
      <p>welcome to your profile for the Rundgang 2021.</p>

      { fetchSpaces ? <Loading /> : <Drafts />}
    </div>
  )
}

export default Profile
