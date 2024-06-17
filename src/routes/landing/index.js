import React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useAuth } from '../../Auth'

const Landing = () => {
  const { t } = useTranslation('landing')
  const auth = useAuth()
  const profile = auth.user

  return (
    <section className="landing">
      <p>
        <Trans t={t} i18nKey="hello">
          Hello
        </Trans>
        {profile && <strong> {profile?.displayname}</strong>}.
      </p>
      <p>
        <Trans t={t} i18nKey="welcome">
          Welcome to the <strong>Rundgang content management system</strong>, which gathers all Rundgang formats from exhibitions and concerts, discussions and lectures to performances and project presentations. All digital and analog Rundgang events and projects can be entered here for publication.
        </Trans>
      </p>
      <hr />
      <p>
        <Trans t={t} i18nKey="introduction-01">
          The Rundgang content management system will go online on <strong>July 3, 2024</strong>. It would be great if the first key data such as date, time, location, short description of the planned formats, e.g. exhibition, performance, installation, etc., had already been entered by then. All further information, such as detailed description texts, images or videos, can be added and updated successively until the first day of the Rundgang, Friday, July 19 at 12 noon.
        </Trans>
      </p>
      <hr />
      <p>
        <Trans t={t} i18nKey="introduction-02">
          Information about the Rundgang 2024 (opening hours, security and awareness, contact persons, etc.):
        </Trans>
        {' '}
        <a href="https://udk-berlin.de/rundgang" rel="external nofollow noopener noreferrer" target="_blank">udk-berlin.de/rundgang</a>
      </p>
    </section>
  )
}

export default Landing
