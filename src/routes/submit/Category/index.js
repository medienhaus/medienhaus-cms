import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import Knock from './Knock'
import { Loading } from '../../../components/loading'
import ContextDropdown from '../../../components/ContextDropdown'

const Category = ({ title, projectSpace }) => {
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
      <p>In which main context do you want to publish your project?</p>
      <p>This information is necessary for showing your project in the right place on the udk rundgang website, and therefore required when setting the project visibility to public.</p>
      <p>The context could be for example a class, a course, a seminar, or also a free project without any specific context. If you are unsure ask the organiser of the context.</p>
      <p>You can scroll through the list, or filter/search the list by typing one or more keywords. Below the all contexts you can find additional information to confirm your choice.</p>
      <div style={{ position: 'relative' }}>
        <ContextDropdown callback={isMember} />
      </div>
      {loading && <Loading />}
      {subject !== '' && !member && <Knock room={room} callback={callback} />}
      {
        // sollte es hier die möglichkeit geben mehrere auszuwählen? also studiengang übergreifende projekte
      }
    </>
  )
}
export default Category
