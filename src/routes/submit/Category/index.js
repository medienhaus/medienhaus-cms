import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import Knock from './Knock'
import { Loading } from '../../../components/loading'

const Category = ({ title, projectSpace }) => {
  const [subject, setSubject] = useState('')
  const [knock, setKnock] = useState('');
  const [loading, setLoading] = useState(false)
  const [member, setMember] = useState(false);
  const matrixClient = Matrix.getMatrixClient()

  const isMember = async (e) => {
    e.preventDefault()
    setLoading(true)
    const rooms = JSON.parse(e.target.value);
    setSubject(e.target.value)
    setKnock(rooms.knock)
    try {
      await matrixClient.members(rooms.space + localStorage.getItem('mx_home_server')).catch(err => console.error(err)).then(res => {
        setMember(res.chunk.map(a => a.sender).includes(localStorage.getItem('mx_user_id')))
      })
      console.log(member);
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
    <div>
      <label htmlFor="subject">Studiengang</label>
      <select id="subject" name="subject" defaultValue={''} value={subject} onChange={(e) => isMember(e)}>
        <option value="" disabled={true} >Select Context</option>
        <option value={JSON.stringify({ knock: "!JaLRUAZnONCuUHMPvy:", space: "!KIIwpwkcYdtsTgSGhw:" })}>New Media</option>
        <option value={JSON.stringify({ knock: "!rorMnDkmfIThdFzwPD:", space: "!qKuBiJVgPrRowlcwTG:" })}>Digitale Klasse</option>
      </select>
      {loading && <Loading />}
      {!member && subject && <Knock roomId={knock} projectSpace={projectSpace} title={title} callback={callback} />}
      {
        // sollte es hier die möglichkeit geben mehrere auszuwählen? also studiengang übergreifende projekte
      }
    </div>
  )
}
export default Category
