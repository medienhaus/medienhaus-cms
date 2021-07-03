import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import Knock from './Knock'
import { Loading } from '../../../components/loading'

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
    <div>
      <label htmlFor="subject">Studiengang</label>
      <select id="subject" name="subject" defaultValue={''} value={subject} onChange={(e) => isMember(e)}>
        <option value="" disabled={true} >Select Context</option>
        <option value={JSON.stringify({ knock: '!MNbLTPjDmMMggNiAqF:', space: '!jlCZIPgvqyfpnbXbKo:', name: 'Designtechniken Modedesign: Schnittkonstruktion' })}>Designtechniken Modedesign: Schnittkonstruktion</option>
        <option value={JSON.stringify({ knock: '!CHZoKrkkFkrkXwRxCd:', space: '!qWnQdvExJViExqebYz:', name: 'Basisprojekt Modedesign: HOODIE GUT, ALLES GUT' })}>Basisprojekt Modedesign: HOODIE GUT, ALLES GUT</option>
        <option value={JSON.stringify({ knock: '!dDHUptRvvBuyxNAjBq:', space: '!KKkTWxprXLKkdZypBe:', name: 'Basisprojekt Produktdesign: fixperts in quarantineg' })}>Basisprojekt Produktdesign: fixperts in quarantine</option>
      </select>
      {loading && <Loading />}
      {subject !== '' && !member && <Knock room={room} callback={callback} />}
      {
        // sollte es hier die möglichkeit geben mehrere auszuwählen? also studiengang übergreifende projekte
      }
    </div>
  )
}
export default Category
