import React, { useEffect, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useAuth } from '../../Auth'
import { isFunction } from 'lodash/lang'
import LanguageSelector from '../LanguageSelector'
import useJoinedSpaces from '../matrix_joined_spaces'
import Matrix from '../../Matrix'
import config from '../../config.json'
import findValueDeep from 'deepdash/findValueDeep'
import { fetchId, fetchTree } from '../../helpers/MedienhausApiHelper'

const Nav = () => {
  const auth = useAuth()
  const history = useHistory()
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const [isModeratingSpaces, setIsModeratingSpaces] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [knockAmount, setKnockAmount] = useState(0)
  const [itemInvites, setItemInvites] = useState([])
  const [contextInvites, setContextInvites] = useState([])
  const { joinedSpaces } = useJoinedSpaces(false)
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    const checkForSpaceWithApi = async (roomId) => {
      const room = await fetchId(roomId)
      if (room?.type === 'context') return true
      else return false
    }

    const checkForSpaesInRoot = async (roomId) => {
      const tree = await fetchTree(process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID).catch(() => {
      })
      const contextObject = findValueDeep(
        tree,
        (value, key, parent) => {
          if (value.id === roomId) return true
        }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true })

      if (contextObject) return true
      else {
        (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && console.debug('not found in tree: ' + roomId)
        return false
      }
    }

    if (joinedSpaces && auth.user) {
      const contextTemplates = config.medienhaus?.context && Object.keys(config.medienhaus?.context)
      // To determine if we're "moderating" a given space...
      const moderatingSpaces = joinedSpaces.filter(space => {
        // 1. it must be of `type` === `context`
        if (space.meta.type !== 'context') return false
        // 2. the user's power level must be at least 50
        if (space.powerLevel < 50) return false
        // and 3. (if templates are given in config.json) must have a valid context template
        if (contextTemplates && !contextTemplates.includes(space.meta.template)) return false
        if (config.medienhaus.api) {
          // we check to see if the space exists in our tree by checking if the api knows about it.
          const spaceIsInRoot = checkForSpaceWithApi(space.room_id)
          if (!spaceIsInRoot) return false
        } else {
          const spaceIsInRoot = checkForSpaesInRoot(space.room_id)
          if (!spaceIsInRoot) return false
        }
        // @TODO: add check if no api is configured
        return true
      })
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
  }, [joinedSpaces, auth.user, matrixClient])

  useEffect(() => {
    async function checkRoomForPossibleInvite (room) {
      // Types of spaces for which we want to count invites for
      const contextTemplates = config.medienhaus?.context && Object.keys(config.medienhaus?.context)
      const itemTemplates = config.medienhaus?.item && Object.keys(config.medienhaus?.item)
      const typesOfTemplates = contextTemplates?.concat(itemTemplates)
      // Ignore if this is not a space
      if (room.getType() !== 'm.space') return
      // Ignore if this is not a "context" or "item"
      const metaEvent = await matrixClient.getStateEvent(room.roomId, 'dev.medienhaus.meta').catch(() => { })
      // ignore if the room doesn't have a medienhaus meta event
      if (!metaEvent) return
      // ignore if there are templates specified within config.json but the room does not follow one of them
      if (typesOfTemplates && !typesOfTemplates.includes(metaEvent.template)) return
      // Ignore if this is not an invitation (getMyMembership() only works correctly after calling _loadMembersFromServer())
      await room.loadMembersFromServer().catch(console.error)
      // At this point we're sure that the room we're checking for is either
      if (room.getMyMembership() === 'invite') {
        // ... 1. an invitation we want to display, so we add it to the state, or ...
        if (metaEvent.type === 'context') setContextInvites((contextInvites) => [...contextInvites, room.roomId])
        else setItemInvites((itemInvites) => [...itemInvites, room.roomId])
      } else {
        // ... 2. a room that the membership has changed for to something other than "invite", so we do -not- want it to be in the state in case it's there right now:
        if (metaEvent.type === 'context') setContextInvites((contextInvites) => contextInvites.filter(invite => invite !== room.roomId))
        else setItemInvites((itemInvites) => itemInvites.filter(invite => invite !== room.roomId))
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

  useEffect(() => {
    if (!auth.user || auth.user === null) return

    const checkAdminPriviliges = async () => {
      setIsAdmin(await matrixClient.isSynapseAdministrator().catch((error) => {
        if (error.errcode === 'M_UNKNOWN_TOKEN') auth.signout(() => history.push('/login'))
      }
      ))
    }
    matrixClient && checkAdminPriviliges()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrixClient, auth.user])

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
          <h1>{process.env.REACT_APP_APP_TITLE}</h1>
        </NavLink>
        {auth.user
          ? <button type="button" className={isNavigationOpen ? 'close' : 'open'} onClick={() => setIsNavigationOpen(!isNavigationOpen)}>
            {isNavigationOpen
              ? '×'
              : (
                <svg viewBox="0 0 100 80" width="40" height="40">
                  <rect width="100" height="20" />
                  <rect y="30" width="100" height="20" />
                  <rect y="60" width="100" height="20" />
                </svg>
                )}
          </button>
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
                <NavLink to="/content">/content <sup className={`notification ${itemInvites.length > 0 ? '' : 'hidden'}`}>●</sup></NavLink>
              </div>
              <div>
                {config.medienhaus?.sites?.account && <NavLink to="/account">/account</NavLink>}
                {config.medienhaus?.sites.moderate && <NavLink to="/moderate" className={!isModeratingSpaces && contextInvites.length < 1 ? 'disabled' : ''}>/moderate<sup className={`notification ${contextInvites.length > 0 || knockAmount > 0 ? '' : 'hidden'}`}>●</sup></NavLink>}
                {isAdmin && <NavLink to="/admin">/admin</NavLink>}
              </div>
              {(config.medienhaus?.sites.feedback || config.medienhaus?.sites?.support || config.medienhaus?.sites?.request) &&
                <div>
                  {config.medienhaus?.sites?.feedback && <NavLink to="/feedback">/feedback</NavLink>}
                  {config.medienhaus?.sites?.support && <NavLink to="/support">/support</NavLink>}
                  {config.medienhaus?.sites?.request && <NavLink to="/request">/request</NavLink>}
                </div>}
              {config.medienhaus?.pages && <div>
                {Object.keys(config.medienhaus.pages).map(key => <NavLink key={key} to={'/pages/' + encodeURI(key)}>{'/' + config.medienhaus.pages[key].label}</NavLink>)}
              </div>}
            </>
          )}
        </div>
        <LanguageSelector />
      </nav>
    </>
  )
}

export default Nav
