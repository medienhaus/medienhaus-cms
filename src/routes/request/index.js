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
  const [parent, setParent] = useState()
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { t } = useTranslation('request')
  const matrixClient = Matrix.getMatrixClient()

  const auth = useAuth()
  const profile = auth.user

  const changeMsg = e => setMsg(e.target.value)
  const changeParent = e => setParent(e.target.value)
  const changeContext = e => setContext(e.target.value)

  const onSubmit = async () => {
    setSending(true)
    const support =
      {
        displayname: `${profile.displayname} (${matrixClient.getUserId()})`,
        parent: parent,
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
          <div>
            <input {...register('context', { required: true })} calue={context} type="text" name="context" id="context" placeholder="name of class" onBlur={changeContext} />
          </div>
          {errors?.operatingSystem && t('Please enter the name of the class.')}
          <div>
            <select {...register('parent', { required: true })} name="parent" id="parent" defaultValue="" onBlur={changeParent}>
              <option value="" disabled>{t('-- please select the parent context --')}</option>
              <option value="Firefox">Visuelle Kommunikation</option>
              <option value="Chrome">Bildende Kunst</option>
              <option value="Other">(Other)</option>
            </select>
          </div>
          {errors?.browser && t('Please select a parent context.')}
          <textarea name="messageInput" placeholder={t('Additional information')} rows="7" spellCheck="true" value={msg} onChange={changeMsg} />
          {errors?.messageInput && t('This field can’t be empty.')}
          <button type="submit" disabled={sending}>{t('SUBMIT')}</button>
        </form>
      </section>
    </>
  )
}
export default Request
