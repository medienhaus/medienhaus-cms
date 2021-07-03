import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../Auth'

const Header = () => {
  const auth = useAuth()
  return (
    <header>
        {/*
        <Link to={auth.user ? '/dashboard' : '/'}>
          <h1>medienhaus/</h1>
        </Link>
        */}
      <Link to={auth.user ? '/' : '/login'}>
          <h1>medienhaus/cms</h1>
        </Link>
      </header>
  )
}

export default Header
