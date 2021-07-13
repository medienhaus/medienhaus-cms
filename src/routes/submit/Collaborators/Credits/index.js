import React, { useState } from 'react'
import Matrix from '../../../../Matrix'
import { Loading } from '../../../../components/loading'

const Credits = ({ name, index, projectSpace, callback }) => {
  const [deleteCreditFeedback, setdeleteCreditFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  const deleteCredit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const content = await matrixClient.getStateEvent(projectSpace, 'm.medienhaus.meta')
    content.credit.splice(index, 1)
    console.log(content)
    const sendCredit = await matrixClient.sendStateEvent(projectSpace, 'm.medienhaus.meta', content)
    setLoading(false)
    setdeleteCreditFeedback('event_id' in sendCredit ? '✓' : 'Something went wrong')
    setTimeout(() => {
      callback()
      setdeleteCreditFeedback('')
    }, 2000)
  }
  return (
      <div style={{ display: 'flex' }}>
        <li style={{ width: '100%' }}>🔒 {name}</li>
        <button onClick={(e) => deleteCredit(e, index)}>{loading ? <Loading /> : deleteCreditFeedback || 'x'}</button>
      </div>
  )
}

export default Credits
