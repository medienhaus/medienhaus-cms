import React, { useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useAuth } from '../../Auth'
import { isFunction } from 'lodash/lang'
import LanguageSelector from '../LanguageSelector'

const Nav = () => {
  const auth = useAuth()
  const history = useHistory()
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)

  if (auth.user === null) {
    return null
  }

  const NavLink = ({ to, onClick, children }) => {
    return (
      <Link
        to={to}
        onClick={() => {
          setIsNavigationOpen(false)
          if (onClick && isFunction(onClick)) onClick()
        }}
      >
        {children}
      </Link>
    )
  }

  return (
    <>
      <header>
        <NavLink to="/">
          <h1>udk/rundgang</h1>
        </NavLink>
        {auth.user
          ? <button type="button" className={isNavigationOpen ? 'close' : 'open'} onClick={() => setIsNavigationOpen(!isNavigationOpen)}>{isNavigationOpen ? '×' : '|||'}</button>
          : <NavLink to="/login">/login</NavLink>}
      </header>
      <nav className={`${(isNavigationOpen && 'active')}`}>
        <div>
          <div>
            {auth.user
              ? <NavLink to="/" onClick={() => auth.signout(() => history.push('/'))}>/logout</NavLink>
              : <NavLink to="/login">/login</NavLink>}
          </div>
          {auth.user && (
            <>
              <div>
                <NavLink to="/submit">/create</NavLink>
                <NavLink to="/projects">/projects</NavLink>
                <NavLink to="/feedback">/feedback</NavLink>
                <NavLink to="/support">/support</NavLink>
                {/*
                <NavLink activeclassname="active" to="/moderation">/moderation</NavLink>
                */}
              </div>
            </>
          )}
        </div>
        <LanguageSelector />
      </nav>
    </>
  )
}

export default Nav
