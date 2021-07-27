import React, { useState } from 'react'
import Name from './Name/name'
import { useAuth } from '../../Auth'
import Avatar from './Avatar/avatar'

const Account = () => {
  const auth = useAuth()
  const profile = auth.user
  const [displayName, setDisplayName] = useState('')

  return (
    <section className="account">
      <Name name={displayName || profile.displayname} callback={(name) => setDisplayName(name)} />
      <Avatar avatarUrl={profile.avatar_url} name={displayName || profile.displayname} />
    </section>
  )
}
export default Account
