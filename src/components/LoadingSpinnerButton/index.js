import { useState } from 'react'
import { Loading } from '../loading'

const LoadingSpinnerButton = ({ disabled, onClick: callback, style, children }) => {
  const [loading, setLoading] = useState(false)

  const onClick = async (e) => {
    e.preventDefault()
    setLoading(true)
    await callback()
    setLoading(false)
  }

  return <button disabled={loading || disabled} onClick={onClick} style={style}>{loading ? <Loading /> : children}</button>
}

export default LoadingSpinnerButton
