import React from 'react'
import Name from './Name/name'
import { useAuth } from '../../Auth'
import Avatar from './Avatar/avatar'

const Account = (params) => {
  const auth = useAuth()
  const profile = auth.user
  return (
    <section className="account">
      <Name name={profile.displayname} />
      <Avatar avatarUrl={profile.avatar_url} />
    </section>
  )
}
export default Account
