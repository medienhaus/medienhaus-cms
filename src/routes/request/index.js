import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { makeRequest } from '../../Backend'
import Matrix from '../../Matrix'
import { useAuth } from '../../Auth'
import mapDeep from 'deepdash/mapDeep'
import filterDeep from 'deepdash/filterDeep'
import struktur from '../../struktur'
import strukturDev from '../../struktur-dev'

const Request = () => {
  const contextMenuWithoutCourses = process.env.NODE_ENV === 'development' ? strukturDev['!ijJyXjLNqgeJkRerIG:dev.medienhaus.udk-berlin.de'].children : struktur['!TCqCDYYsBUxmjWOZWV:content.udk-berlin.de'].children

  const { register, formState: { errors }, handleSubmit } = useForm()
  const [msg, setMsg] = useState('')
  const [context, setContext] = useState()
  const [parent, setParent] = useState('')
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
  const changeParent = e => setParent(e.target.value)
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
      await makeRequest('messenger/requestContext', request)
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
        <p>{t('In case your context is not listed in the context menu, please fill out the form below and we will evaluate your request. Thank you!')}</p>
        <p><em>{t('Note: context can be a class, course, seminar, workshop, et cetera …')}</em></p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <input {...register('context', { required: true })} value={context} type="text" name="context" id="context" placeholder={t('name of your context')} onChange={changeContext} />
          </div>
          {errors?.context && t('Please enter the name of the context.')}
          <div>
            <input {...register('supervisor', { required: true })} value={supervisor} type="text" name="supervisor" id="supervisor" placeholder={t('person responsible')} onChange={changeSupervisor} />
          </div>
          {errors?.supervisor && t('Please enter the name of the person responsible.')}
          <div>
            <input {...register('contact', { required: true })} value={contact} type="text" name="contact" id="contact" placeholder={t('person responsible’s @(intra.)udk-berlin.de❗️ mail address')} onChange={changeContact} />
          </div>
          {errors?.contact && t('Please enter a valid @(intra.)udk-berlin.de mail address.')}
          <div>
            <select {...register('parent', { required: true })} value={parent} onChange={changeParent}>
              <option disabled value="">-- {t('please select the superordinate course/institute/faculty')} --</option>
              {mapDeep(filterDeep(contextMenuWithoutCourses, (value, key, parent, context) => {
                // exclude all "courses"
                if (value?.type === 'course') return false
                return true
              }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true }), (value, key, parent, context) => {
                value.name = ' ↳ '.repeat(context.depth - 1) + value.name
                return value
              }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true }).map(x => (
                <option key={x.id} value={x.name + ' ' + x.id}>{x.name}</option>
              ))}
            </select>
          </div>
          {errors?.parent && t('Please enter the the superordinate course/institute/faculty')}
          <textarea name="messageInput" placeholder={t('additional information')} rows="7" spellCheck="true" value={msg} onChange={changeMsg} />
          <button type="submit" disabled={sending}>{t('REQUEST')}</button>
        </form>
        {feedback}
      </section>
    </>
  )
}
export default Request
