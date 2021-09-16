import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { makeRequest } from '../../Backend'
import Matrix from '../../Matrix'
import { useAuth } from '../../Auth'

const Request = () => {
  const { register, formState: { errors }, handleSubmit } = useForm()
  const [msg, setMsg] = useState('')
  const [context, setContext] = useState()
  const [browser, setBrowser] = useState()
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { t } = useTranslation('request')
  const matrixClient = Matrix.getMatrixClient()

  const auth = useAuth()
  const profile = auth.user

  const changeMsg = e => setMsg(e.target.value)
  const changeBrowser = e => setBrowser(e.target.value)
  const changeContext = e => setContext(e.target.value)

  const onSubmit = async () => {
    setSending(true)
    const support =
      {
        displayname: `${profile.displayname} (${matrixClient.getUserId()})`,
        browser: browser,
        context: context,
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
      setContext('')
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
        <p>{t('In case you are trying to find a context room but can´t find it, you can request it here.')}</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div><input {...register('operatingSystem', { required: true })} calue={context} name="context" id="context" placeholder="name of class" onBlur={changeContext} />
          </div>
          {errors?.operatingSystem && t('Please enter the name of the class.')}
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
export default Request
