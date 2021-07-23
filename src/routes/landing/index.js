import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'
import { NavLink, useHistory } from 'react-router-dom'

const Landing = () => {
  const { t } = useTranslation('landing')
  const auth = useAuth()
  const profile = auth.user
  const history = useHistory()

  return (
    <div>
      <p>{t('Hello')} <strong>{profile?.displayname}</strong>.</p>

      <strong>{t('Welcome to the Rundgang 2021 content management system!')}</strong>
      <p>{t('The Rundgang – Open Days of the Berlin University of the Arts will take place for the first time in both analogue and digital space from 29–31 October 2021. On this platform, you will have the opportunity to create your own projects and thus add information on analogue offers or present digitally created semester projects.')}</p>
      {auth.user && (
        <>
          <p>
            <Trans t={t} i18nKey="bbbAndPeertube">
              We also offer you the possibility to offer virtual meetings via the video conferencing tool BigBlueButton at <a href="https://meetings.udk-berlin.de" rel="external nofollow noopener noreferrer" target="_blank">udk/meet</a> and to integrate videos and live streams via <a href="https://stream.udk-berlin.de" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a> on your own project page.
            </Trans>
          </p>
          <button onClick={() => history.push('/create')}>{t('create new project')}</button>
          <p>
            <Trans t={t} i18nKey="feedback">
              As the platform is a new tool that can continue to enrich the Rundgang – Open Days in the future, we would be happy if you send us your feedback via the <NavLink to="/feedback">/feedback</NavLink> link in the menu.
            </Trans>
          </p>
          <p>
            <Trans t={t} i18nKey="support">
              If you need technical support for entering projects, please fill out the <NavLink to="/support">/support</NavLink> form.
            </Trans>
          </p>
        </>
      )}
      <p><em>{t('Please note: The public-facing Rundgang website on which all projects will be presented, is still under construction. Therefore, it is not yet possible to preview the projects that have been created.')}</em></p>
    </div>
  )
}

export default Landing
