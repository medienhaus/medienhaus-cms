import React, { useState } from 'react'
import Matrix from '../../../../Matrix'
import { Loading } from '../../../../components/loading'

const Credits = ({ name, index, projectSpace, callback }) => {
  const [deleteCreditFeedback, setdeleteCreditFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()
  const hashCode = (string) => {
    let hash = 0; let i; let chr
    if (string.length === 0) return hash
    for (i = 0; i < string.length; i++) {
      chr = string.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash |= 0
    }
    return hash
  }

  const items = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😋', '🥳', '😶', '😷']
  const item = items[(hashCode(name) + index) % items.length]

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
    <li><span>{item} {name}</span><button onClick={(e) => deleteCredit(e, index)}>{loading ? <Loading /> : deleteCreditFeedback || '×'}</button></li>
  )
}

export default Credits
