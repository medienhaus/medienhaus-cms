import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'

const Category = () => {
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  const isMember = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSubject(e.target.value)
    const member = await matrixClient.members(e.target.value + localStorage.getItem('mx_home_server')).catch(err => console.error(err)).then(console.log)
    console.log(member?.chunk)
    setLoading(false)
  }
  return (
        <div>
        <label htmlFor="subject">Studiengang</label>
        <select id="subject" name="subject" defaultValue={''} value={subject} onChange={(e) => isMember(e)}>
            <option value="" disabled={true} >Select Content</option>
          <option value="!KIIwpwkcYdtsTgSGhw:">New Media</option>
          <option value="act">Schauspiel</option>
          <option value="clown">Clown</option>
          <option value="kunst">Kunst</option>
            </select>
        {loading && <Loading />}
        {
        // sollte es hier die möglichkeit geben mehrere auszuwählen? also studiengang übergreifende projekte
        }
    </div>
  )
}
export default Category
