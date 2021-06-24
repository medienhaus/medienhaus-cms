import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import Knock from './Knock'
import { Loading } from '../../../components/loading'

const Category = () => {
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [member, setMember] = useState(false);
  const matrixClient = Matrix.getMatrixClient()

  const isMember = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSubject(e.target.value)
    await matrixClient.members(e.target.value + localStorage.getItem('mx_home_server')).catch(err => console.error(err)).then(res => {
      setMember(res.chunk.map(a => a.sender).includes(localStorage.getItem('mx_user_id')))
    })
    console.log(member);
    setLoading(false)
  }


  return (
    <div>
      <label htmlFor="subject">Studiengang</label>
      <select id="subject" name="subject" defaultValue={''} value={subject} onChange={(e) => isMember(e)}>
        <option value="" disabled={true} >Select Content</option>
        <option value="!JaLRUAZnONCuUHMPvy:">New Media</option>
        <option value="!rorMnDkmfIThdFzwPD:">Digitale Klasse</option>
        <option value="clown">Clown</option>
        <option value="kunst">Kunst</option>
      </select>
      {loading && <Loading />}
      {!member && subject && <Knock roomId={subject} />}
      {
        // sollte es hier die möglichkeit geben mehrere auszuwählen? also studiengang übergreifende projekte
      }
    </div>
  )
}
export default Category
