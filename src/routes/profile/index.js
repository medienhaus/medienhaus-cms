import React from 'react'
import { useAuth } from '../../Auth'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import { Loading } from '../../components/loading'

const Profile = () => {
  const auth = useAuth()
  const profile = auth.user
  const {joinedSpaces, spacesErr, fetchSpaces} = useJoinedSpaces()


  const Projects = () => {
    var draftCounter = 0;
    return (
      <>
        {joinedSpaces && <p>You have <strong>{joinedSpaces.filter(x => x.published === "invite").length}</strong> drafts, which are not publicly visible.</p>}
        
      <ul>
          {spacesErr ? console.error(spacesErr) : joinedSpaces?.filter(x => x.published === "invite").map((space, index) => {
              return <li>{space.name}</li>
      }) 
        }
        </ul>
        
        {joinedSpaces && <p>You have <strong>{joinedSpaces.filter(x => x.published === "public").length}</strong> published projects, which are publicly visible.</p>}
        
        <ul>
            {spacesErr ? console.error(spacesErr) : joinedSpaces?.filter(x => x.published === "public").map((space, index) => {
                return <li>{space.name}</li>
        }) 
          }
        </ul>
      </>
    )
  }



  return (
    <div>
      <p>Hello <strong>{profile.displayname}</strong></p>
      <p>welcome to your profile for the Rundgang 2021.</p>

      {fetchSpaces ? <Loading /> : (
        <Projects />
      
      )}
    </div>
  )
}

export default Profile
