import React, { useState } from 'react'
import Name from './Name/name'
import { useAuth } from '../../Auth'
import Avatar from './Avatar/avatar'
import { Email } from './Email'

const Account = () => {
  const auth = useAuth()
  const profile = auth.user
  const [displayName, setDisplayName] = useState('')
  console.log(profile)
  return (
    <section className="account">
      <Name name={displayName || profile.displayname} callback={(name) => setDisplayName(name)} />
      <Avatar avatarUrl={profile.avatar_url} name={displayName || profile.displayname} />
      <Email />
    </section>
  )
}
export default Account
