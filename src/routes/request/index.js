import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation, Trans } from 'react-i18next'
import { makeRequest } from '../../Backend'
import Matrix from '../../Matrix'
import { useAuth } from '../../Auth'

const Request = () => {
  const { register, formState: { errors }, handleSubmit } = useForm()
  const [msg, setMsg] = useState('')
  const [context, setContext] = useState()
  const [parent, setParent] = useState()
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [supervisor, setSupervisor] = useState('')
  const [contact, setContact] = useState('')
  const [feedback, setFeedback] = useState('')
  const { t } = useTranslation('request')
  const matrixClient = Matrix.getMatrixClient()

  const auth = useAuth()
  const profile = auth.user

  const changeMsg = e => setMsg(e.target.value)
  const changeParent = e => { console.log(e); setParent(e) }
  const changeContext = e => setContext(e.target.value)
  const changeSupervisor = e => setSupervisor(e.target.value)
  const changeContact = e => setContact(e.target.value)

  const onSubmit = async () => {
    setSending(true)
    const request =
      {
        displayname: `${profile.displayname} (${matrixClient.getUserId()})`,
        supervisor: supervisor,
        parent: parent,
        contact: contact,
        context: context,
        msg: msg
      }
    try {
      await makeRequest('messenger/requestAcc', request)
        .then(msg => {
          console.log(msg)
        })
      setSending(false)
      setSubmitted(true)
      setMsg('')
      setContext('')
    } catch (e) {
      console.log(e)
      setFeedback('Couldn’t send your message. ' + e)
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
        <p><Trans i18nkey="introduction">In case you are trying to find a context room but can\'t find it, you can request it here.</Trans></p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <input {...register('context', { required: true })} value={context} type="text" name="context" id="context" placeholder={t('name of context')} onBlur={changeContext} />
          </div>
          {errors?.context && t('Please enter the name of the context.')}
          <div>
            <input {...register('supervisor', { required: true })} value={context} type="text" name="supervisor" id="supervisor" placeholder={t('supervisor')} onBlur={changeSupervisor} />
          </div>
          {errors?.supervisor && t('Please enter the name of the person in charge.')}
          <div>
            <input {...register('contact', { required: true })} value={context} type="text" name="contact" id="contact" placeholder={t('UdK (!) email address')} onBlur={changeContact} />
          </div>
          {errors?.supervisor && t('Please enter a UdK email address.')}
          <div>
            <input {...register('parent', { required: true })} value={parent} type="text" name="parent" id="parent" placeholder={t('Parent space, e.g. Faculty Design.')} onBlur={changeParent} />
            {/* @TODO Needs hint or longer explanation what this means */}
          </div>
          {errors?.parent && t('Please enter a parent space. For example the faculty in which the class is taking place.')}
          <textarea name="messageInput" placeholder={t('additional information')} rows="7" spellCheck="true" value={msg} onChange={changeMsg} />
          <button type="submit" disabled={sending}>{t('SUBMIT')}</button>
        </form>
        {feedback}
      </section>
    </>
  )
}
export default Request
