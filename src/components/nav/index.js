import React, { useEffect, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useAuth } from '../../Auth'
import { isFunction } from 'lodash/lang'
import LanguageSelector from '../LanguageSelector'
import useJoinedSpaces from '../matrix_joined_spaces'
import Matrix from '../../Matrix'
const Nav = () => {
  const auth = useAuth()
  const history = useHistory()
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const [knockAmount, setKnockAmount] = useState(0)
  const { joinedSpaces, spacesErr, fetchSpaces } = useJoinedSpaces(false)
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    if (spacesErr) console.log(spacesErr)
    if (joinedSpaces && auth.user) {
      const filteredRooms = joinedSpaces.filter(space => space.meta.type === 'context').map(space => {
        return matrixClient.getRoom(space.room_id)
      })
      if (filteredRooms.length > 0) {
        const allKnocks = []
        filteredRooms.forEach(room => {
          Object.values(room.currentState.members)
            .forEach(user => allKnocks.push(user))
        })
        // @TODO change back to knock when context is finished
        setKnockAmount(allKnocks.filter(user => user.membership === 'invite').length)
      }
    }
  }, [joinedSpaces, auth.user, matrixClient, spacesErr])

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
                <NavLink to="/create">/create</NavLink>
                <NavLink to="/projects">/projects</NavLink>
                {fetchSpaces || <>
                  <NavLink activeclassname="active" to="/moderation">/moderation{knockAmount > 0 && <sup className="notification">●</sup>}</NavLink>
                  {/* eslint-disable-next-line react/jsx-closing-tag-location */}
                </>}
              </div>
              <div>
                <NavLink to="/feedback">/feedback</NavLink>
                <NavLink to="/support">/support</NavLink>
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
