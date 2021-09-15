import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'
import { NavLink, useHistory } from 'react-router-dom'

const Landing = () => {
  const { t } = useTranslation('landing')
  const auth = useAuth()
  const profile = auth.user
  const history = useHistory()

  const countdown = (dt, id) => {
    const end = new Date(dt)

    const _second = 1000
    const _minute = _second * 60
    const _hour = _minute * 60
    const _day = _hour * 24

    const now = new Date()
    const distance = end - now
    if (distance < 0) return t('expired')

    const days = Math.floor(distance / _day)
    const hours = Math.floor((distance % _day) / _hour)
    const minutes = Math.floor((distance % _hour) / _minute)

    return days + t(' days ') + hours + t(' hours ') + minutes + t(' minutes ')
  }

  return (
    <section className="landing">
      <p>{t('Hello')}{profile && <strong> {profile?.displayname}</strong>}.</p>
      <h2>{t('Welcome to the Rundgang 2021 content management system!')}</h2>
      {/* TODO: @marcel-klasse please add remaining days and or hours until noon; fix locales for <1>x days left …</1> */}
      <p>
        <Trans t={t} i18nKey="countdown">
          Only projects that are being published (i.e. not drafts) until October 08 are eligible for the Rundgang 2021 print program. <strong style={{ color: 'rgb(228,9,59)' }}>{countdown('10/08/2021 12:00 AM')}</strong> left...
        </Trans>
      </p>
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
              Feedback will be evaluated, but will not be answered. If you have a question and/or need technical support for entering projects, please fill out the <NavLink to="/support">/support</NavLink> form and we will get back at you.
            </Trans>
          </p>
          <p>
            <Trans t={t} i18nKey="credits">
              Credits & Team can be found on the <NavLink to="/credits">/credits</NavLink> page.
            </Trans>
          </p>
        </>
      )}
    </section>
  )
}

export default Landing
