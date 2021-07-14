import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'
import { makeRequest } from '../../Backend'

const Feedback = () => {
  const { register, formState: { errors }, handleSubmit } = useForm()
  const [msg, setMsg] = useState('')
  const [mail, setMail] = useState('')
  const [sending, setSending] = useState(false)
  const { t } = useTranslation('feedback')

  const auth = useAuth()
  const profile = auth.user

  const changeMsg = e => setMsg(e.target.value)
  const changeMail = e => setMail(e.target.value)

  const onSubmit = async () => {
    setSending(true)
    const support =
      {
        displayname: profile.displayname,
        mail: mail,
        msg: msg
      }
    try {
      await makeRequest('messenger/feedback', support)
        .then(msg => {
          console.log(msg)
        })
      alert('Thank you! Your message has ben sent.')
      setSending(false)
      setMail('')
      setMsg('')
    } catch (e) {
      console.log(e)
      alert('Couldn’t send your message. ' + e)
      setSending(false)
    }
  }

  return (
    <>
      <section className="support">
        <h2>{t('As the platform is a new tool that can continue to enrich the Rundgang – Open Days in the future, we would be happy if you send us your feedback on how to handle the system.')}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
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
          <textarea {...register('messageInput', { required: true })} name="messageInput" placeholder={t('Your feedback …')} rows="7" spellCheck="true" value={msg} onChange={changeMsg} />
          {errors?.messageInput && 'This field can’t be empty.'}
          <button type="submit" disabled={sending}>{t('SUBMIT')}</button>
        </form>
      </section>
    </>
  )
}

export default Feedback
