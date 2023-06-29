import React, { useState } from 'react'
import { useForm } from 'react-hook-form' // https://github.com/react-hook-form/react-hook-form
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'
import { makeRequest } from '../../Backend'
import Matrix from '../../Matrix'

const Support = () => {
  const { register, formState: { errors }, handleSubmit } = useForm()
  const [msg, setMsg] = useState('')
  const [system, setSystem] = useState()
  const [browser, setBrowser] = useState()
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { t } = useTranslation('support')
  const matrixClient = Matrix.getMatrixClient()

  const auth = useAuth()
  const profile = auth.user

  const changeMsg = e => setMsg(e.target.value)
  const changeBrowser = e => setBrowser(e.target.value)
  const changeSystem = e => setSystem(e.target.value)

  const onSubmit = async () => {
    setSending(true)
    const support =
      {
        displayname: `${profile.displayname} (${matrixClient.getUserId()})`,
        browser: browser,
        system: system,
        msg: msg
      }
    try {
      await makeRequest('messenger/support', support)
        .then(msg => {
          console.log(msg)
        })
      setSending(false)
      setSubmitted(true)
      setMsg('')
      setSystem('')
    } catch (e) {
      console.log(e)
      alert('Couldn’t send your message. ' + e)
      setSending(false)
    }
  }

  if (submitted) {
    return (
      <section>
        <p>{t('Your message has been sent! We will get back to you.')}</p>
      </section>
    )
  }
  return (
    <>
      <section className="support">
        <p>{t('Please have a look at these video tutorials:')} <a href="https://stream.udk-berlin.de/w/p/43Hj9AaeewRLiUdRLmvzLH" rel="external nofollow noopener noreferrer" target="_blank">udk/rundgang — HOW TO </a></p>
        <p>{t('In case you\'re having trouble with /moderate, have a look here: ')} <a href="https://stream.udk-berlin.de/w/p/fPiujcDcZPYss1bb5d7eFk" rel="external nofollow noopener noreferrer" target="_blank">udk/rundgang — /moderate</a></p>
        <p>{t('Please provide some details and tell us about the problem you encounter.')}</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <select {...register('operatingSystem', { required: true })} name="operatingSystem" id="operatingSystem" defaultValue="" onBlur={changeSystem}>
              <option value="" disabled>{t('-- select operating system --')}</option>
              <option value="Linux">Linux</option>
              <option value="macOS">macOS</option>
              <option value="Windows">Windows</option>
              <option value="iOS">iOS</option>
              <option value="android">Android</option>
              <option value="Other">(Other)</option>
            </select>
          </div>
          {errors?.operatingSystem && t('Please select an operating system.')}
          <div>
            <select {...register('browser', { required: true })} name="browser" id="browser" defaultValue="" onBlur={changeBrowser}>
              <option value="" disabled>{t('-- select web browser --')}</option>
              <option value="Firefox">Firefox</option>
              <option value="Chrome">Chrome</option>
              <option value="Safari">Safari</option>
              <option value="Opera">Opera</option>
              <option value="Edge">Edge</option>
              <option value="Internet Explorer">Internet Explorer</option>
              <option value="Other">(Other)</option>
            </select>
          </div>
          {errors?.browser && t('Please select a web browser.')}
          <textarea {...register('messageInput', { required: true })} name="messageInput" placeholder={t('Please describe the problem you encounter …')} rows="7" spellCheck="true" value={msg} onChange={changeMsg} />
          {errors?.messageInput && t('This field can’t be empty.')}
          <button type="submit" disabled={sending}>{t('SUBMIT')}</button>
        </form>
      </section>
    </>
  )
}

export default Support
