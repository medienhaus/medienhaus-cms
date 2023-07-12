import React, { useEffect } from 'react'
import { useAuth } from '../../Auth'
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min'
import { Loading } from '../../components/loading'

const Logout = () => {
  const auth = useAuth()
  const history = useHistory()

  useEffect(() => {
    auth && auth.signout(() => history.push('/'))
  }, [auth, history])

  return <Loading />
}
export default Logout
