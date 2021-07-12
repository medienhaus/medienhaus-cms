import React from 'react'
import { Trans, useTranslation } from 'react-i18next'

const Landing = () => {
  const { t } = useTranslation('landing')
  return (
    <div>
      <Trans t={t} i18nKey="welcome">
     <strong>Welcome to the Rundgang 2021 content management system!</strong>
<p>
  The Rundgang – Open Days of the Berlin University of the Arts will take place for the first time in both analogue and digital space from 29 - 31 October 2021. On this platform, you will have the opportunity to create your own projects and thus add information on analogue offers or present digitally created semester projects. We also offer you the possibility to offer meetings via the video conferencing tool BigBlueButton and to integrate videos and livestreams via udk/stream on your own project page.
  As the platform is a new tool that can continue to enrich the Rundgang – Open Days in the future, we would be happy if you send us your feedback on how to handle the system to feedback-rundgang-plattform@udk-berlin.de. If you need technical support for entering projects, please contact rundgang-support@udk-berlin.de.
  Please note: The frontend, i.e. the public website on which all projects will be visible, is still under construction Therefore, it is not yet possible to preview the projects that have been created.
</p>
</Trans>
    </div>
  )
}
/*
<section id="team">
        <h2><strong>Team</strong> (sorted alphabetically):</h2>
        <ul>
          <li>Alexej Bormatenkow</li>
          <li>Dirk Erdmann</li>
          <li><a href="mailto:kg@udk-berlin.de?subject=medienhaus/" rel="external nofollow noreferrer">Klaus Gasteier</a></li>
          <li>Marcel Haupt</li>
          <li><a href="mailto:dh@udk-berlin.de?subject=medienhaus/" rel="external nofollow noreferrer">Daniel Hromada</a></li>
          <li>Frederik Müller</li>
          <li>Andi Rueckel</li>
          <li>Merani Schilcher</li>
          <li><a href="mailto:rfws@udk-berlin.de?subject=medienhaus/" rel="external nofollow noreferrer">Robert Schnüll</a></li>
          <li>Paul Seidler</li>
        </ul>
      </section>
*/

export default Landing
