import React, { useState } from 'react'
import { useHistory } from 'react-router'
import { useTranslation } from 'react-i18next'

const Terms = () => {
  const history = useHistory()
  const [consent0, setConsent0] = useState(false)
  const [consent1, setConsent1] = useState(false)
  const [consent2, setConsent2] = useState(false)
  const [consent3, setConsent3] = useState(false)
  const [consent4, setConsent4] = useState(false)
  const { t } = useTranslation('terms')

  return (
    <section className="terms">
      <p>Before uploading any content, we kindly ask you to read through and accept the following terms & conditions and content violation policies. <strong>No worries, you only have to do this once. Thank you!</strong></p>
      <div>
        <input id="checkbox0" name="checkbox0" type="checkbox" value={consent0} onChange={() => setConsent0(consent0 => !consent0)} />
        <label htmlFor="checkbox0">{t('I (We) hereby confirm that the rights to the image, video and/or sound material uploaded here belong to me (us) and that I (we) have all the rights required to make the image, video and/or sound material publicly accessible, to reproduce, distribute and exhibit it as part of the tour of the Berlin University of the Arts. I (we) confirm that the use of the uploaded image, video and/or sound material for this purpose does not infringe any third-party rights, in particular copyright, ancillary copyright, trademark or patent rights, title protection rights, trade secrets, personal rights or other rights or property rights of third parties.')}</label>
      </div>
      <div>
        <input id="checkbox1" name="checkbox1" type="checkbox" value={consent1} onChange={() => setConsent1(consent1 => !consent1)} />
        <label htmlFor="checkbox1">{t('I (we) hereby confirm that the image, video and/or sound material uploaded here does not contain any extremist, violence-glorifying, inciting or pornographic content.')}</label>
      </div>
      <div>
        <input id="checkbox2" name="checkbox2" type="checkbox" value={consent2} onChange={() => setConsent2(consent2 => !consent2)} />
        <label htmlFor="checkbox2">{t('I (we) declare that I (we) am (are) prepared to indemnify the Berlin University of the Arts on first demand against all claims made by third parties against the use of the material for the purpose stated in section 1 or in the event of a breach of the principles stated in clause 2.')}</label>
      </div>
      <div>
        <input id="checkbox3" name="checkbox3" type="checkbox" value={consent3} onChange={() => setConsent3(consent3 => !consent3)} />
        <label htmlFor="checkbox3">{t('I (we) hereby give my (our) consent that this material may be made publicly accessible and archived via the tour platform or exhibited as part of the tour of the Berlin University of the Arts. Furthermore, I (we) agree that the uploaded content may be used for an analogue programme booklet or made publicly accessible on the website of the Berlin University of the Arts for information and advertising purposes, the latter also beyond the duration of the tour.')}</label>
      </div>
      <div>
        <input id="checkbox4" name="checkbox4" type="checkbox" value={consent4} onChange={() => setConsent4(consent4 => !consent4)} />
        <label htmlFor="checkbox4">{t('I (we) acknowledge and agree that in the event of an actual or potential breach of the principles set out in sections 1 and 2 above, the image, video and/or sound material may be removed from the platform, either in whole or in part.¸')}</label>
      </div>
      <button name="submit" type="submit" disabled={!consent0 || !consent1 || !consent2 || !consent3 || !consent4} onClick={() => {
        localStorage.setItem('terms-consent', true)
        history.push('/projects')
      }}>ACCEPT & SAVE</button>
    </section>
  )
}

export default Terms
