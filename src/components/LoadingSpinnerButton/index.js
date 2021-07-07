import { useEffect, useRef, useState } from 'react'
import { Loading } from '../loading'

const LoadingSpinnerButton = ({ disabled, onClick: callback, style, children, stopPropagationOnClick }) => {
  const [loading, setLoading] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    // needed to add this cleanup useEffect to prevent memory leaks
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const onClick = async (e) => {
    if (stopPropagationOnClick) e.stopPropagation()
    e.preventDefault()
    setLoading(true)
    await callback().catch(err => console.log(err))
      .finally(() => {
        if (isMounted.current) {
          setLoading(false)
        }
      })
  }

  return <button disabled={loading || disabled} onClick={onClick} style={style}>{loading ? <Loading /> : children}</button>
}

export default LoadingSpinnerButton
