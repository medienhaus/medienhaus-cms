import React, { useState } from 'react'
import { useForm } from 'react-hook-form' // https://github.com/react-hook-form/react-hook-form
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'
import { makeRequest } from '../../Backend'

const Support = () => {
  const { register, formState: { errors }, handleSubmit } = useForm()
  const [msg, setMsg] = useState('')
  const [mail, setMail] = useState('')
  const [system, setSystem] = useState()
  const [browser, setBrowser] = useState()
  const [sending, setSending] = useState(false)
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
      alert('Your message has ben sent! We will get back to you asap …')
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
            <label htmlFor="operatingSystem">{t('operating system')}</label>
            <select {...register('operatingSystem', { required: true })} name="operatingSystem" id="operatingSystem" defaultValue="" onBlur={changeSystem}>
              <option value="" disabled hidden>-- select operating system --</option>
              <option value="Linux">Linux</option>
              <option value="macOS">macOS</option>
              <option value="Windows">Windows</option>
              <option value="iOS">iOS</option>
              <option value="android">Android</option>
              <option value="Other">(Other)</option>
            </select>
          </div>
          {errors?.operatingSystem && 'Please select an operating system.'}
          <div>
            <label htmlFor="browser">{t('web browser')}</label>
            <select {...register('browser', { required: true })} name="browser" id="browser" defaultValue="" onBlur={changeBrowser}>
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
            <label htmlFor="email">{t('email address')}</label>
            {/* eslint-disable no-useless-escape */}
            <input
              {...register('email', { required: true, pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ })}
              type="email"
              name="email"
              id="email"
              placeholder="u.name@udk-berlin.de"
              value={mail}
              onChange={changeMail}
            />
            {/* eslint-enable no-useless-escape */}
          </div>
          {errors?.email && 'Please enter a valid email address.'}
          <textarea {...register('messageInput', { required: true })} name="messageInput" placeholder={t('Please describe the problem you encounter …')} rows="7" spellCheck="true" value={msg} onChange={changeMsg} />
          {errors?.messageInput && 'This field can’t be empty.'}
          <button type="submit" disabled={sending}>{t('SUBMIT')}</button>
        </form>
      </section>
    </>
  )
}

export default Support
