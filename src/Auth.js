import React, { createContext, useContext, useEffect, useState } from 'react'
import Matrix from './Matrix'
import * as PropTypes from 'prop-types'

const AuthContext = createContext(undefined)

function AuthProvider ({ children }) {
  console.log(children)
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

  const signin = (username, password, server, callback) => {
    return Matrix.login(username, password, server).then((response) => {
      hydrateLocalStorage(response)
      fetchAndSetUserData(callback)
    })
  }

  const signinUsingToken = (token, callback) => {
    return Matrix.loginWithToken(token).then((response) => {
      hydrateLocalStorage(response)
      fetchAndSetUserData(callback)
    })
  }

  const signout = cb => {
    // @TODO Implement
    return Matrix.getMatrixClient().logout(() => {
      localStorage.clear()
      setUser(false)
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
    Matrix.getMatrixClient().getProfileInfo(localStorage.getItem('medienhaus_user_id')).then((profile) => {
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
