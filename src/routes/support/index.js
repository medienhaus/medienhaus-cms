import React, { useState } from 'react'
import { useForm } from 'react-hook-form' // https://github.com/react-hook-form/react-hook-form
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'
import { makeRequest } from '../../Backend'

const Support = () => {
  const { handleSubmit, errors } = useForm()
  const [msg, setMsg] = useState('')
  const [mail, setMail] = useState('')
  const [system, setSystem] = useState()
  const [browser, setBrowser] = useState()
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState('')
  const { t } = useTranslation('support')

  const auth = useAuth()
  const profile = auth.user

  const changeMsg = e => setMsg(e.target.value)
  const changeMail = e => setMail(e.target.value)
  const changeBrowser = e => setBrowser(e.target.value)
  const changeSystem = e => setSystem(e.target.value)

  const onSubmit = async () => {
    setSending(true)
    const support =
      {
        displayname: profile.displayname,
        mail: mail,
        browser: browser,
        system: system,
        msg: msg
      }
    try {
      await makeRequest('messenger/support', support)
        .then(msg => {
          console.log(msg)
        })
      console.log(support)
      setFeedback('Your message has ben sent! We will get back to you asap …')
      setSending(false)
      setMail('')
      setMsg('')
      setSystem('')
    } catch (e) {
      console.log(e)
      alert('Couldn’t send your message. ' + e)
      setSending(false)
    }
  }

  return (
    <>
      <section className="support">
        <h2>{t('In case you didn\'t find an answer to your question here, please provide us some details and tell us about the problem you encounter via the support form below.')}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <h3>{t('Operating System')}</h3>
            <select
              name="Operating System" defaultValue="" onBlur={changeSystem}
            >
              <option value="" disabled hidden>-- select operating system --</option>
              <option value="Linux">Linux</option>
              <option value="macOS">macOS</option>
              <option value="Windows">Windows</option>
              <option value="iOS">iOS</option>
              <option value="android">Android</option>
              <option value="Other">(Other)</option>
            </select>
          </div>
          {errors?.browser && 'Please select an operating system.'}
          <div>
            <h3>{t('Web Browser')}</h3>
            <select
              name="browser" defaultValue="" onBlur={changeBrowser}
            >
              <option value="" disabled hidden>-- select web browser --</option>
              <option value="Firefox">Firefox</option>
              <option value="Chrome">Chrome</option>
              <option value="Safari">Safari</option>
              <option value="Opera">Opera</option>
              <option value="Edge">Edge</option>
              <option value="Internet Explorer">Internet Explorer</option>
              <option value="Other">(Other)</option>
            </select>
          </div>
          {errors?.browser && 'Please select a web browser.'}
          <div>
            <h3>{t('Mail Address')}</h3>
            <input
              type="email" placeholder="u.name@udk-berlin.de" name="email" value={mail} onChange={changeMail}
            />
          </div>
          {errors?.email && 'Please enter a valid email address.'}
          <div>
            <h3>{t('Your Message')}</h3>
            <textarea
              name="messageInput" placeholder={t('Please describe the problem you encounter …')} rows="7" spellCheck="true" value={msg} onChange={changeMsg}
            />
          </div>
          {errors?.messageInput && 'This field can’t be empty.'}
          <button type="submit" disabled={sending}>{t('SUBMIT')}</button>
          {feedback}
        </form>
      </section>
    </>
  )
}

export default Support
