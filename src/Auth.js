import React, { createContext, useContext, useEffect, useState } from 'react'
import Matrix from './Matrix'
import * as PropTypes from 'prop-types'
import useJoinedSpaces from './components/matrix_joined_spaces'
import { useHistory } from 'react-router-dom'

const AuthContext = createContext(undefined)

function AuthProvider ({ children }) {
  const auth = useAuthProvider()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.element
}

function useAuth () {
  return useContext(AuthContext)
}

function useAuthProvider () {
  const [user, setUser] = useState(null)
  const [folderDialogueOpen, setFolderDialogueOpen] = useState(false)
  const { reload } = useJoinedSpaces(false)
  const history = useHistory()

  const signin = (username, password, server, callback) => {
    return Matrix.login(username, password, server).then((response) => {
      hydrateLocalStorage(response)
      fetchAndSetUserData(callback)
      // !localStorage.getItem(process.env.REACT_APP_APP_NAME + '_space') && !folderDialogueOpen && lookForApplicationsFolder(callback)
    })
  }

  const signinUsingToken = (token, callback) => {
    return Matrix.loginWithToken(token).then((response) => {
      hydrateLocalStorage(response)
      fetchAndSetUserData(callback)
      // !localStorage.getItem(process.env.REACT_APP_APP_NAME + '_space') && !folderDialogueOpen && lookForApplicationsFolder(callback)
    })
  }

  const signout = cb => {
    // @TODO Implement
    return Matrix.getMatrixClient().logout(true)
      .then(() => {
        setUser(false)
        localStorage.clear()
        cb()
      })
  }

  const hydrateLocalStorage = (response) => {
    // Set localStorage items for medienhaus/
    localStorage.setItem('medienhaus_access_token', response.access_token)
    localStorage.setItem('medienhaus_user_id', response.user_id)
    localStorage.setItem('medienhaus_hs_url', response.well_known['m.homeserver'].base_url)
    localStorage.setItem('medienhaus_home_server', response.home_server)

    // Set localStorage items for the Element client to automatically be logged-in
    localStorage.setItem('mx_access_token', response.access_token)
    localStorage.setItem('mx_home_server', response.home_server)
    localStorage.setItem('mx_hs_url', response.well_known['m.homeserver'].base_url)
    localStorage.setItem('mx_hs_url', response.well_known['m.homeserver'].base_url)
    localStorage.setItem('mx_user_id', response.user_id)
    localStorage.setItem('mx_device_id', response.device_id)
    localStorage.setItem('mx_labs_feature_feature_spaces', true)
  }

  const fetchAndSetUserData = (callback) => {
    Matrix.getMatrixClient().getProfileInfo(localStorage.getItem('medienhaus_user_id')).then(async (profile) => {
      if (profile) {
        setUser(profile)
      } else {
        setUser(false)
      }
      if (callback) { callback() }
    }).catch((error) => {
      console.log(error)
      setUser(false)
    })
  }

  const lookForApplicationsFolder = async (reloadedSpaces) => {
    setFolderDialogueOpen(true)
    const spaces = reloadedSpaces
    const findApplicationsFolder = spaces.find(space => space.meta?.template === 'applications')
    if (findApplicationsFolder) {
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') console.debug('found applications folder')
      await lookForServiceFolder(findApplicationsFolder.room_id, spaces)
    } else {
      // For environments with a pre-defined context root space ID we want to automatically create the
      // "Applications > medienhaus-cms" space to store all of our items in ...
      let createApplicationSpace = ''
      if (!process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID) {
        // ... but if there's none defined we want to ask the user if it's okay to create one, or if they want to
        // provide one they manually created
        createApplicationSpace = window.prompt(`We couldn't find a space for ${process.env.REACT_APP_APP_NAME}. \n\n You can either enter an existing space in the field below in the form of \n\n  !OWpL.....FTOWuq:matrix.org \n\n or just leave it empty to automatically create one. \n`)
      }
      if (createApplicationSpace === null) {
        signout(() => history.push('/'))
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
        await lookForServiceFolder(newApplicationsFolder.room_id, spaces)
      }
      if (createApplicationSpace) {
        console.log(createApplicationSpace)
        if (!createApplicationSpace.includes(localStorage.getItem('medienhaus_home_server'))) {
          alert('roomId must contain ' + localStorage.getItem('medienhaus_home_server'))
          return lookForApplicationsFolder(spaces)
        }
        // setApplicationSpace(createApplicationSpace)
        localStorage.setItem(process.env.REACT_APP_APP_NAME + '_space', createApplicationSpace)
        setFolderDialogueOpen(false)
      }
    }
  }

  const lookForServiceFolder = async (applicationsSpaceId, spaces) => {
    const findServiceSpace = spaces.find(space => space.name === process.env.REACT_APP_APP_NAME)
    if (findServiceSpace) {
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') console.debug('found service folder')

      localStorage.setItem(process.env.REACT_APP_APP_NAME + '_space', findServiceSpace.room_id)
      // private / drafts
      localStorage.setItem(process.env.REACT_APP_APP_NAME + '_space', spaces.find(space => space.name === 'drafts').room_id)
      // public
      if (process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID) {
        // If there's a context root space ID provided by the .env file, we use that one ...
        localStorage.setItem(process.env.REACT_APP_APP_NAME + '_root_context_space', process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID)
      } else {
        // ... otherwise we look for the space called "public"
        localStorage.setItem(process.env.REACT_APP_APP_NAME + '_root_context_space', spaces.find(space => space.name === 'public').room_id)
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
        const createPublicSpace = await Matrix.getMatrixClient().createRoom(opts).catch(console.log)
        await Matrix.addSpaceChild(createRoom.room_id, createPublicSpace.room_id)
        localStorage.setItem(process.env.REACT_APP_APP_NAME + '_root_context_space', createPublicSpace.room_id)
      }
    }
    reload()
    setFolderDialogueOpen(false)
  }

  useEffect(() => {
    if (localStorage.getItem('medienhaus_user_id') && localStorage.getItem('medienhaus_access_token')) {
      fetchAndSetUserData()
    } else {
      setUser(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      Matrix.startSync()
    }
  }, [user])

  const reloadJoinedSpaces = async () => {
    const reloadedSpaces = await reload()
    if (reloadedSpaces) lookForApplicationsFolder(reloadedSpaces)
  }

  useEffect(() => {
    // we check to see if the initial sync is done which will
    const checkForCompletedSync = async () => {
      if (Matrix.getMatrixClient().isInitialSyncComplete() && !localStorage.getItem(process.env.REACT_APP_APP_NAME + '_space') && !folderDialogueOpen) {
        reloadJoinedSpaces()
      } else {
        setTimeout(() => {
          checkForCompletedSync()
        }, 300)
      }
    }
    checkForCompletedSync()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    user,
    signin,
    signinUsingToken,
    signout
  }
}

export {
  AuthProvider,
  useAuth
}
