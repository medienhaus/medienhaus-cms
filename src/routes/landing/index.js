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
      <p>
        <Trans t={t} i18nKey="introduction-01">
          The Rundgang – Open Days of the Berlin University of the Arts will take place in both analogue and digital space from 23–24 July 2022.
        </Trans>
      </p>
      <p>
        <Trans t={t} i18nKey="introduction-02">
          On this platform, you will have the opportunity to create your own projects and events and thus add information on analogue offers or present digitally created semester projects.
        </Trans>
      </p>
      <p>
        <Trans t={t} i18nKey="introduction-03">
          We also offer you the possibility to offer meetings via the video conferencing tool <a href="https://meetings.udk-berlin.de/" rel="external nofollow noopener noreferrer" target="_blank">udk/meetings</a> (BigBlueButton) and to integrate videos and livestreams via <a href="https://stream.udk-berlin.de/" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a> on your own project page.
        </Trans>
      </p>
      <hr />
      <p>
        <Trans t={t} i18nKey="introduction-04">
          As the platform is a relatively new tool that can continue to enrich the Rundgang – Open Days in the future, we would be happy if you send us your feedback on how to handle the system to: <a href="mailto:feedback-rundgang-plattform@udk-berlin.de">feedback-rundgang-plattform@udk-berlin.de</a>
        </Trans>
      </p>
      <p>
        <Trans t={t} i18nKey="introduction-05">
          If you need technical support for entering projects, please contact: <a href="mailto:rundgang-support@udk-berlin.de">rundgang-support@udk-berlin.de</a>
        </Trans>
      </p>
      {/*
      <hr />
      <p>
        <Trans t={t} i18nKey="please-note">
          The frontend, i.e. the public website on which all projects will be visible, is still under construction. Therefore, it is not yet possible to preview the projects that have been created.
        </Trans>
      </p>
      */}
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
