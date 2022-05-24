import React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useAuth } from '../../Auth'

const Landing = () => {
  const { t } = useTranslation('landing')
  const auth = useAuth()
  const profile = auth.user

  return (
    <section className="landing">
      <p>{t('Hello')}{profile && <strong> {profile?.displayname}</strong>}.</p>
      <h2>{t('Welcome to the {{appTitle}} content management system!', { appTitle: process.env.REACT_APP_APP_TITLE })}</h2>
      <hr />
      <p>{t('The Rundgang – Open Days of the Berlin University of the Arts will take place in both analogue and digital space in July. On this platform, you will have the opportunity to create your own projects and thus add information on analogue offers or present digitally created semester projects.')}</p>
      <hr />
      <p>
        <Trans t={t} i18nKey="information">
          For more information on the Rundgang 2022 (opening hours, safety and hygiene measures, etc.), please visit: <a href="https://udk-berlin.de/rundgang" rel="external nofollow noopener noreferrer" target="_blank">udk-berlin.de/rundgang</a>
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
