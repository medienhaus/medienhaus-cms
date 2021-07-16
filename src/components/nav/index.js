import React, { useState } from 'react'
import i18n from 'i18next'
import { Link, useHistory } from 'react-router-dom'
import { useAuth } from '../../Auth'

const Nav = () => {
  const auth = useAuth()
  const history = useHistory()
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)

  const changeLanguage = event => {
    const languageCode = event.target.value
    localStorage.setItem('cr_lang', languageCode)
    i18n.changeLanguage(languageCode)
  }

  if (auth.user === null) {
    return null
  }

  const NavLink = ({ to, children }) => {
    return (
      <Link to={to} onClick={() => setIsNavigationOpen(false)}>{children}</Link>
    )
  }

  return (
    <>
      <header>
        <NavLink to="/">
          <h1>udk/rundgang</h1>
        </NavLink>
        <button type="button" className={isNavigationOpen ? 'close' : 'open'} onClick={() => setIsNavigationOpen(!isNavigationOpen)}>{isNavigationOpen ? '×' : '|||'}</button>
      </header>
      <nav className={`${(isNavigationOpen && 'active')}`}>
        <div>
          <div>
            {auth.user
              ? <Link to="/" onClick={() => auth.signout(() => history.push('/'))}>/logout</Link>
              : <NavLink to="/login">/login</NavLink>}
          </div>
          {auth.user && (
            <>
              <div>
                <NavLink to="/submit">/create</NavLink>
                <NavLink to="/projects">/projects</NavLink>
                <NavLink to="/feedback">/feedback</NavLink>
                <NavLink to="/support">/support</NavLink>
                {/* <NavLink activeclassname="active" to="/tools">/tools</NavLink>  only for dev */}
                {/*
                <NavLink activeclassname="active" to="/moderation">/moderation</NavLink>
                */}
              </div>
            </>
          )}
        </div>
        <select defaultValue={i18n.language} onChange={changeLanguage}>
          <option value="en">EN</option>
          <option value="de">DE</option>
        </select>
      </nav>
    </>
  )
}

export default Nav
