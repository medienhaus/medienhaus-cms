import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'

const Landing = () => {
  const { t } = useTranslation('landing')
  const auth = useAuth()
  const profile = auth.user

  return (
    <section className="landing">
      <p>{t('Hello')}{profile && <strong> {profile?.displayname}</strong>}.</p>
      <h2>{t('Welcome to the ruralmindshift.org content management system!')}</h2>
    </section>
  )
}

export default Landing
