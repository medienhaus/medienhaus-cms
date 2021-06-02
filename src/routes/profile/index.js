import React from 'react' 
import { useAuth } from '../../Auth'

const Profile = () => {
  const auth = useAuth()
  const profile = auth.user

  return (
    <div>
      <p>Hello <strong>{profile.displayname}</strong></p>
      <p>welcome to your profile for the Rundgang 2021.</p>
    </div>
  )
}

export default Profile
