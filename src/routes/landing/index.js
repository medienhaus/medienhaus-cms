import React from 'react'
import { Trans, useTranslation } from 'react-i18next'

const Landing = () => {
  const { t } = useTranslation('landing')
  return (
    <div>
      <Trans t={t} i18nKey="welcome">
        <strong>Welcome to the Rundgang 2021 content management system!</strong>
        <p>The Rundgang – Open Days of the Berlin University of the Arts will take place for the first time in both analogue and digital space from 29–31 October 2021. On this platform, you will have the opportunity to create your own projects and thus add information on analogue offers or present digitally created semester projects.</p>
        <p>We also offer you the possibility to offer virtual meetings via the video conferencing tool BigBlueButton at <a href="https://meetings.udk-berlin.de" rel="external nofollow noopener noreferrer" target="_blank">udk/meet</a> and to integrate videos and live streams via <a href="https://stream.udk-berlin.de" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a> on your own project page.</p>
        <p>As the platform is a new tool that can continue to enrich the Rundgang – Open Days in the future, we would be happy if you send us your feedback on how to handle the system via the <a href="/feedback">/feedback</a> link in the menu.</p>
        <p>If you need technical support for entering projects, please fill out the form via the <a href="/support">/support</a> link, which can also be found in the menu after logging in.</p>
        <p><em>Please note: The public-facing Rundgang website on which all projects will be presented, is still under construction. Therefore, it is not yet possible to preview the projects that have been created.</em></p>
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
