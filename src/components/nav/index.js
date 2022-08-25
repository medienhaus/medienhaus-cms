import React, { useEffect, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useAuth } from '../../Auth'
import { isFunction } from 'lodash/lang'
import LanguageSelector from '../LanguageSelector'
import useJoinedSpaces from '../matrix_joined_spaces'
import Matrix from '../../Matrix'
import config from '../../config.json'
import { fetchId } from '../../helpers/MedienhausApiHelper'

const Nav = () => {
  const auth = useAuth()
  const history = useHistory()
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const [isModeratingSpaces, setIsModeratingSpaces] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [knockAmount, setKnockAmount] = useState(0)
  const [itemInvites, setItemInvites] = useState([])
  const [contextInvites, setContextInvites] = useState([])
  const [applicationSpace, setApplicationSpace] = useState(localStorage.getItem(process.env.REACT_APP_APP_NAME + '_space'))
  const [folderDialogueOpen, setFolderDialogueOpen] = useState(false)
  const { joinedSpaces, reload } = useJoinedSpaces(false)
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    let cancelled = false

    const lookForServiceFolder = async (applicationsSpaceId) => {
      const findServiceSpace = joinedSpaces.find(space => space.name === process.env.REACT_APP_APP_NAME)
      if (findServiceSpace) {
        localStorage.setItem(process.env.REACT_APP_APP_NAME + '_space', findServiceSpace.room_id)
        setApplicationSpace(findServiceSpace.room_id)
        // private / drafts
        localStorage.setItem(process.env.REACT_APP_APP_NAME + '_space', joinedSpaces.find(space => space.name === 'drafts').room_id)
        setApplicationSpace(joinedSpaces.find(space => space.name === 'drafts').room_id)
        // public
        if (process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID) {
          // If there's a context root space ID provided by the .env file, we use that one ...
          localStorage.setItem(process.env.REACT_APP_APP_NAME + '_root_context_space', process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID)
        } else {
          // ... otherwise we look for the space called "public"
          localStorage.setItem(process.env.REACT_APP_APP_NAME + '_root_context_space', joinedSpaces.find(space => space.name === 'public').room_id)
        }
      } else {
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') console.info('creating service space')
        const createRoom = await Matrix.createRoom(
          process.env.REACT_APP_APP_NAME,
          true,
          '',
          'invite',
          'context',
          'application')
        await Matrix.addSpaceChild(applicationsSpaceId, createRoom.room_id)

        // private / drafts
        const createPrivateSpace = await Matrix.createRoom(
          'drafts',
          true,
            `This is your private space for the application ${process.env.REACT_APP_APP_NAME}. You can find all your unpublished ${process.env.REACT_APP_APP_NAME} drafts in here.`,
            'invite',
            'context',
            'application')
        await Matrix.addSpaceChild(createRoom.room_id, createPrivateSpace.room_id)
        setApplicationSpace(createPrivateSpace.room_id)
        localStorage.setItem(process.env.REACT_APP_APP_NAME + '_space', createPrivateSpace.room_id)

        // public
        if (process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID) {
          // If there's a context root space ID provided by the .env file, we use that one ...
          localStorage.setItem(process.env.REACT_APP_APP_NAME + '_root_context_space', process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID)
        } else {
          // ... otherwise we create a space called "public" which the user can manage and moderate themselves
          const medienhausMeta = {
            version: '0.4',
            type: 'context',
            published: 'public',
            template: 'application'
          }

          const opts = {
            preset: 'public_chat',
            power_level_content_override: {
              ban: 50,
              events: {
                'm.room.avatar': 50,
                'm.room.canonical_alias': 50,
                'm.room.encryption': 100,
                'm.room.history_visibility': 100,
                'm.room.name': 50,
                'm.room.power_levels': 50,
                'm.room.server_acl': 100,
                'm.room.tombstone': 100,
                'm.space.child': 0, // @TODO this needs to be a config flag, wether users are allowed to just add content to contexts or need to knock and be invited first.
                'm.room.topic': 50,
                'm.room.pinned_events': 50,
                'm.reaction': 50,
                'im.vector.modular.widgets': 50
              },
              events_default: 50,
              historical: 100,
              invite: 50,
              kick: 50,
              redact: 50,
              state_default: 50,
              users_default: 0
            },
            name: 'public',
            topic: `This is your public space for the application ${process.env.REACT_APP_APP_NAME}. You can find all your published ${process.env.REACT_APP_APP_NAME} data in here.`,
            room_version: '9',
            creation_content: { type: 'm.space' },
            initial_state: [{
              type: 'm.room.history_visibility',
              content: { history_visibility: 'world_readable' } //  history
            },
            {
              type: 'dev.medienhaus.meta',
              content: medienhausMeta
            },
            {
              type: 'm.room.guest_access',
              state_key: '',
              content: { guest_access: 'can_join' }
            }],
            visibility: 'private' // visibility is private even for public spaces.
          }

          // create the space for the context
          const createPublicSpace = await matrixClient.createRoom(opts).catch(console.log)
          await Matrix.addSpaceChild(createRoom.room_id, createPublicSpace.room_id)
          localStorage.setItem(process.env.REACT_APP_APP_NAME + '_root_context_space', createPublicSpace.room_id)
        }
      }
      setFolderDialogueOpen(false)
      reload()
    }

    const lookForApplicationsFolder = async () => {
      setFolderDialogueOpen(true)
      const findApplicationsFolder = joinedSpaces.find(space => space.meta?.template === 'applications')
      if (findApplicationsFolder) {
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') console.debug('found applications folder')
        await lookForServiceFolder(findApplicationsFolder.room_id)
      } else {
        const createApplicationSpace = window.prompt(`We couldn't find a space for ${process.env.REACT_APP_APP_NAME}. \n\n You can either enter an existing space in the field below in the form of \n\n  !OWpL.....FTOWuq:matrix.org \n\n or just leave it empty to automatically create one. \n`)
        if (createApplicationSpace === null) {
          auth.signout(() => history.push('/'))
          return
        }
        if (createApplicationSpace === '') {
          console.log('creating root applications folder')
          const newApplicationsFolder = await Matrix.createRoom(
            'Applications',
            true,
            'This is your private applications space. You can find all your application data in here.',
            'invite',
            'context',
            'applications')
          await lookForServiceFolder(newApplicationsFolder.room_id)
        }
        if (createApplicationSpace) {
          console.log(createApplicationSpace)
          if (!createApplicationSpace.includes(localStorage.getItem('medienhaus_home_server'))) {
            alert('roomId must contain ' + localStorage.getItem('medienhaus_home_server'))
            return lookForApplicationsFolder()
          }
          setApplicationSpace(createApplicationSpace)
          localStorage.setItem(process.env.REACT_APP_APP_NAME + '_space', createApplicationSpace)
          setFolderDialogueOpen(false)
        }
      }
    }

    if (joinedSpaces && auth.user && !cancelled) {
      !applicationSpace && !folderDialogueOpen && lookForApplicationsFolder()

      const contextTemplates = config.medienhaus?.context && Object.keys(config.medienhaus?.context)
      // To determine if we're "moderating" a given space...
      const moderatingSpaces = joinedSpaces.filter(async space => {
        // 1. it must be of `type` === `context`
        if (space.meta.type !== 'context') return false
        // 2. the user's power level must be at least 50
        if (space.powerLevel < 50) return false
        // and 3. (if templates are given in config.json) must have a valid context template
        if (contextTemplates && !contextTemplates.includes(space.meta.template)) return false
        // and 4. check to see if the space is part of the context tree
        if (config.medienhaus.api) {
          const room = await fetchId(space.room_id)
          if (room.statusCode) return false
        } else {
          // @TODO Add this check for environments without API
        }
        return true
      })
      // If we are not moderating any spaces we can cancel the rest here ...
      if (moderatingSpaces.length < 1) {
        setIsModeratingSpaces(false)
        return
      }
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

    return () => {
      cancelled = true
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
        // we reload our joinedSpaces to update out moderating spaces
        reload()
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
