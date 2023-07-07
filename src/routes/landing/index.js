import React from 'react'
import { NavLink } from 'react-router-dom'
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
      <h2>
        <Trans t={t} i18nKey="welcome">
          Welcome to the Rundgang platform!
        </Trans>
      </h2>
      <hr />
      <p>
        <Trans t={t} i18nKey="introduction-01">
          The Rundgang of the Berlin University of the Arts will take place from July 21–23, 2023. All digital and analog Rundgang events and projects can be entered on the Rundgang platform for publication.
        </Trans>
      </p>
      <p>
        <Trans t={t} i18nKey="introduction-02">
          The Rundgang platform will go online on July 5, 2023. For this reason, if possible, all key data of the Rundgang projects should be entered no later than July 4, 2023, 23:59. Format, date, time, location, short description and (preliminary) title are sufficient for now. All other details (descriptive texts, images, videos, etc.) can be updated successively and until the Rundgang.
        </Trans>
      </p>
      <p>
        <Trans t={t} i18nKey="introduction-03">
          Projects that are entered on the platform by July 4 will then be included in the printed program. The printed program will be available for visitors at the locations during the Rundgang days.
        </Trans>
      </p>
      <p>
        <Trans t={t} i18nKey="introduction-04">
          Projects that are not entered on the platform by July 4, 2023, unfortunately cannot be included in the printed program sheet.
        </Trans>
      </p>
      <hr />
      <p>
        <Trans t={t} i18nKey="questions-01">
          Material/Technical requests: If special technical equipment or furnishings are needed for Rundgang events (which are not already available within the degree programs and studios), please always inform the responsible janitor. Requests must be received at least 14 days prior to the Rundgang weekend so that needs and feasibility can be assessed.
        </Trans>
      </p>
      <p>
        <Trans t={t} i18nKey="questions-02">
          Preview function of the projects: The Rundgang platform will be opened to the public on July 5. A preview of the created projects is unfortunately not possible before that for technical reasons. The design of the pages is already fixed and is currently being implemented for the Rundgang website.
        </Trans>
      </p>
      <p>
        <Trans t={t} i18nKey="informations">
          For support and feedback regarding the content management system, please visit <NavLink to="/feedback">/feedback</NavLink> and <NavLink to="/support">/support</NavLink>. Information about the Rundgang 2023 (opening hours, security and awareness, contact persons, Rundgang FAQ etc.) via: <a href="https://udk-berlin.de/rundgang" rel="external nofollow noopener noreferrer" target="_blank">udk-berlin.de/rundgang</a>
        </Trans>
      </p>
    </section>
  )
}

export default Landing
