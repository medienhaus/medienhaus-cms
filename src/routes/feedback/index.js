import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'
import { makeRequest } from '../../Backend'
import Matrix from '../../Matrix'

const Feedback = () => {
  const { register, formState: { errors }, handleSubmit } = useForm()
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { t } = useTranslation('feedback')
  const matrixClient = Matrix.getMatrixClient()

  const auth = useAuth()
  const profile = auth.user

  const changeMsg = e => setMsg(e.target.value)

  const onSubmit = async () => {
    setSending(true)
    const support =
      {
        displayname: `${profile.displayname} (${matrixClient.getUserId()})`,
        msg: msg
      }
    try {
      await makeRequest('messenger/feedback', support)
        .then(msg => {
          console.log(msg)
        })
      setSending(false)
      setSubmitted(true)
      setMsg('')
    } catch (e) {
      console.log(e)
      alert('Couldn’t send your message. ' + e)
      setSending(false)
    }
  }

  if (submitted) {
    return (
      <section>
        <p>{t('Thank you for your feedback!')}</p>
        <p><Trans t={t} i18nKey="submittedMessage">We are collecting your feedback and will evaluate it after the Rundgang 2022. If you need technical help with entering your contributions, please reach out via the <NavLink to="/support">/support</NavLink> form.</Trans></p>
      </section>
    )
  }
  return (
    <>
      <section className="support">
        <p>{t('As the platform is a new tool that can continue to enrich the Rundgang – Open Days in the future, we would be happy if you send us your feedback.')}</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <textarea {...register('messageInput', { required: true })} name="messageInput" placeholder={t('Your feedback …')} rows="7" spellCheck="true" value={msg} onChange={changeMsg} />
          {errors?.messageInput && t('This field can’t be empty.')}
          <button type="submit" disabled={sending}>{t('SUBMIT')}</button>
        </form>
        <p>
          * <em>
            <Trans t={t} i18nKey="note">
              Feedback will be evaluated, but will not be answered. If you have a question and/or need technical support for entering projects, please fill out the <NavLink to="/support">/support</NavLink> form and we will get back at you.
            </Trans>
          </em>
        </p>
      </section>
    </>
  )
}

export default Feedback
