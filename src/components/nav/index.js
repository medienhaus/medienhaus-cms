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
  const [isModeratingSpaces, setIsModeratingSpaces] = useState(false)
  const [knockAmount, setKnockAmount] = useState(0)
  const [invites, setInvites] = useState([])
  const { joinedSpaces, spacesErr } = useJoinedSpaces(false)
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    if (spacesErr) console.log(spacesErr)
    if (joinedSpaces && auth.user) {
      const typesOfSpaces = ['context',
        'class',
        'course',
        'institution',
        'degree program',
        'design department',
        'faculty',
        'institute',
        'semester']
      // To "moderate" a space it must have one of the given types and we must be at least power level 50
      const moderatingSpaces = joinedSpaces.filter(space => typesOfSpaces.includes(space.meta.type) && space.powerLevel >= 50)
      // If we are not moderating any spaces we can cancel the rest here ...
      if (moderatingSpaces.length < 1) return

      // ... but if we -are- indeed moderating at least one space, we want to find out if there are any pending knocks
      setIsModeratingSpaces(true)

      async function getAmountOfPendingKnocks () {
        const fullRoomObjectForModeratingSpaces = await Promise.all(moderatingSpaces.map(async (space) => await matrixClient.getRoom(space.room_id)))

        const pendingKnocks = []
        // For each space we're moderating...
        fullRoomObjectForModeratingSpaces.forEach(room => {
          // ... go through every room member...
          Object.values(room.currentState.members).forEach(user => {
            // .. and if they're currently knocking add them to the pendingKnocks array.
            if (user.membership === 'knock') pendingKnocks.push(user)
          })
        })
        setKnockAmount(pendingKnocks.length)
      }

      getAmountOfPendingKnocks()
    }
  }, [joinedSpaces, auth.user, matrixClient, spacesErr])

  useEffect(() => {
    async function checkRoomForPossibleInvite (room) {
      // Types of spaces for which we want to count invites for
      const typesOfSpaces = [
        'studentproject',
        'context',
        'class',
        'course',
        'institution',
        'degree program',
        'design department',
        'faculty',
        'institute',
        'semester']

      // Ignore if this is not a space
      if (room.getType() !== 'm.space') return
      // Ignore if this is not a student project or a "context"
      const metaEvent = await matrixClient.getStateEvent(room.roomId, 'dev.medienhaus.meta').catch(() => { })
      if (!metaEvent || !metaEvent.type || !typesOfSpaces.includes(metaEvent.type)) return
      // Ignore if this is not an invitation (getMyMembership() only works correctly after calling _loadMembersFromServer())
      await room.loadMembersFromServer().catch(console.error)
      // At this point we're sure that the room we're checking for is either
      if (room.getMyMembership() === 'invite') {
        // ... 1. an invitation we want to display, so we add it to the state, or ...
        setInvites((invites) => [...invites, room.roomId])
      } else {
        // ... 2. a room that the membership has changed for to something other than "invite", so we do -not- want it to be in the state in case it's there right now:
        setInvites(invites => invites.filter(invite => invite !== room.roomId))
      }
    }

    // On page load: Get current set of invitations
    const allRooms = matrixClient.getRooms()
    allRooms.forEach(checkRoomForPossibleInvite)

    // While on the page: Listen for incoming room events to add possibly new invitations to the state
    matrixClient.on('Room.myMembership', checkRoomForPossibleInvite)
    // When navigating away from /content we want to stop listening for those room events again
    return () => {
      matrixClient.removeListener('Room.myMembership', checkRoomForPossibleInvite)
    }
  }, [matrixClient])

  if (auth.user === null) {
    return null
  }

  const NavLink = ({ to, onClick, children, className }) => {
    return (
      <Link
        to={to}
        className={className}
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
                <NavLink to="/content">/content <sup className={`notification ${invites.length > 0 ? '' : 'hidden'}`}>●</sup></NavLink>
              </div>
              <div>
                <NavLink to="/account">/account</NavLink>
                <NavLink to="/moderate" className={!isModeratingSpaces ? 'disabled' : ''}>/moderate<sup className={`notification ${knockAmount < 1 ? 'hidden' : ''}`}>●</sup></NavLink>
              </div>
              <div>
                <NavLink to="/feedback">/feedback</NavLink>
                <NavLink to="/support">/support</NavLink>
                <NavLink to="/request" className="disabled">/request</NavLink>
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
