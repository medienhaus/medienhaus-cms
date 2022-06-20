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
    const content = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta')
    content.credit.splice(index, 1)
    console.log(content)
    const sendCredit = await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.meta', content)
    setLoading(false)
    setdeleteCreditFeedback('event_id' in sendCredit ? '✓' : 'Something went wrong')
    setTimeout(() => {
      callback()
      setdeleteCreditFeedback('')
    }, 2000)
  }
  return (
    <li>
      <span>{name}</span><button style={{ width: '2rem', height: '2rem', display: 'grid', placeContent: 'center' }} onClick={(e) => deleteCredit(e, index)}>
        {loading ? <Loading /> : deleteCreditFeedback || '×'}
      </button>
    </li>
  )
}

export default Credits
