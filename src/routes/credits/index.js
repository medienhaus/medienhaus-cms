import React from 'react'
import { useTranslation } from 'react-i18next'
// import { useAuth } from '../../Auth'
// import { NavLink, useHistory } from 'react-router-dom'

const Credits = () => {
  const { t } = useTranslation('credits')
  // const auth = useAuth()
  // const profile = auth.user
  // const history = useHistory()

  return (
    <section className="credits">
      {/*
      {auth.user && (
      */}
      <h2>Credits & Team</h2>
      <p>{t('We would like to thank all students and teachers of the UdK Berlin for organising and presenting their work during the Rundgang – Open Days.')}</p>
      <p>{t('They are supported by the following core team:')}</p>
      <p>{t('Coordination and organisation: Department for Facility Management, Occupational Health & Safety under the direction of Irina Heckendorff')}</p>
      <p>{t('Head of Event: Felix Wolf (Department for Facility Management, Occupational Health & Safety)')}</p>
      <p>{t('Deputy Head of Event: Jan Krause (Department for Facility Management, Occupational Health & Safety)')}</p>
      <p>{t('Marketing and Rundgang online platform in cooperation with the medienhaus/ team: Marketing & University Events Department under the direction of Dr. Michaela Conen')}</p>
      <p>{t('Rundgang online platform: medienhaus/ team, supervised by Andi Rueckel, Robert Schnüll and Prof. Klaus Gasteier, in cooperation with Insa Ruckdeschel, Project Manager of the Marketing & University Events Department')}</p>
      <p>{t('Press relations, online communication and social media: Press & Communication Unit headed by Claudia Assmann.')}</p>
      <p>{t('Pandemic advice is provided by the company doctor of the UdK Berlin Dr. Stefan Linnig')}</p>
      <p>{t('The Berlin University of the Arts is legally represented by the President Prof. Dr. Norbert Palz')}</p>
      {/*
      )}
      */}
    </section>
  )
}

export default Credits
