import React, { useState } from 'react'
import Name from './Name/name'
import { useAuth } from '../../Auth'
import Avatar from './Avatar/avatar'
import { Email } from './Email'

import config from '../../config.json'

const Account = () => {
  const auth = useAuth()
  const profile = auth.user
  const [displayName, setDisplayName] = useState('')

  return (
    <section className="account">
      {config.medienhaus.sites.account.name && <Name name={displayName || profile.displayname} callback={(name) => setDisplayName(name)} />}
      {config.medienhaus.sites.account.avatar && <Avatar avatarUrl={profile.avatar_url} name={displayName || profile.displayname} />}
      {config.medienhaus.sites.account.mail && <Email />}
    </section>
  )
}
export default Account
