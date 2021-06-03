import React from 'react'

const Header = () => {
  
  return (
    <header>
        {/*
        <Link to={auth.user ? '/dashboard' : '/'}>
          <h1>medienhaus/</h1>
        </Link>
        */}
        <a href='/'>
          <h1>medienhaus/cms</h1>
        </a>
      </header>
  )
}

export default Header
