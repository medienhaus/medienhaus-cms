import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'

const Landing = () => {
  const { t } = useTranslation('landing')
  const auth = useAuth()
  const profile = auth.user

  return (
    <section className="landing">
      <p>{t('Hello')}{profile && <strong> {profile?.displayname}</strong>}.</p>
      <h2>{t('Welcome to the Rundgang 2021 content management system!')}</h2>
      <p>{t('Please enter information about your Rundgang projects here. The platform will be activated for the public on October 25, 2021, so that visitors can plan their visit before the tour begins. Even after October 25, it is still possible to make adjustments to your project pages.')}</p>
      <hr />
      <p>{t('The Rundgang – Open Days of the Berlin University of the Arts will take place for the first time in both analogue and digital space from 29–31 October 2021. On this platform, you will have the opportunity to create your own projects and thus add information on analogue offers or present digitally created semester projects.')}</p>
      <hr />
      <p>
        <Trans t={t} i18nKey="information">
          For more information on the Rundgang 2021 (opening hours, safety and hygiene measures, etc.), please visit: <a href="https://udk-berlin.de/rundgang" rel="external nofollow noopener noreferrer" target="_blank">udk-berlin.de/rundgang</a>
        </Trans>
      </p>
      <hr />
      <p>
        <Trans t={t} i18nKey="human-readable-first">
          All content is stored in compliance with the “human readable first” paradigm and can&thinsp;&mdash;&thinsp;besides the udk/rundgang content management system&thinsp;&mdash;&thinsp;be accessed, read, modified, and deleted with any fully-featured Matrix client via: <code>content.udk-berlin.de</code>
        </Trans>
      </p>
      <p>
        ❗️ <Trans t={t} i18nKey="caution">
          Please note that manual content editing should be considered <em>advanced technique</em> and might break the content structure if not complying the <code>dev.medienhaus.meta</code> standard.
        </Trans>
      </p>
    </section>
  )
}

export default Landing
