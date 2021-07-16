import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import Knock from './Knock'
import { Loading } from '../../../components/loading'
import ContextDropdown from '../../../components/ContextDropdown'
import { Trans, useTranslation } from 'react-i18next'

const Category = ({ title, projectSpace }) => {
  const { t } = useTranslation('projects')
  const [subject, setSubject] = useState('')
  const [room, setRoom] = useState('')
  const [loading, setLoading] = useState(false)
  const [member, setMember] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  const isMember = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMember(true)
    setSubject(e.target.value)
    setRoom(JSON.parse(e.target.value))
    try {
      await matrixClient.members(room.space + localStorage.getItem('mx_home_server')).catch(err => console.error(err)).then(res => {
        setMember(res.chunk.map(a => a.sender).includes(localStorage.getItem('mx_user_id')))
      })
      console.log(member)
    } catch (err) {
      console.error(err)
      setMember(false)
    }

    setLoading(false)
  }
  const callback = (requested) => {
    setSubject('')
  }

  return (
    <>
      <p>{t('In which context do you want to publish your project?')}</p>
      <p>{t('This information is necessary to show your project in the right place on the Rundgang 2021 website, and must therefore be specified when you change the visibility of the project to public.')}</p>
      <p>{t('The context can be a class, a course, a seminar or a free project. If you are unsure, ask the professor of your class or the seminar leader.')}</p>
      <p>{t('You can scroll through the list, or filter/search the list by typing one or more keywords.')}</p>
      <div style={{ position: 'relative' }}>
        <ContextDropdown callback={isMember} />
      </div>
      <p>﹡ <em><Trans t={t}>This is not yet possible; we will roll out an update soon; the context is required for publishing your project on the Rundgang 2021 website.</Trans></em></p>
      {loading && <Loading />}
      {subject !== '' && !member && <Knock room={room} callback={callback} />}
    </>
  )
}
export default Category
