import React, { createContext, useContext, useEffect, useState } from 'react'
import Matrix from './Matrix'
import * as PropTypes from 'prop-types'

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

  const signin = (username, password, callback) => {
    return Matrix.login(username, password).then(() => {
      fetchAndSetUserData(callback)
    })
  }

  const signout = cb => {
    // @TODO Implement
    // return fakeAuth.signout(() => {
    //   setUser(null);
    //   cb();
    // });
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

  return {
    user,
    signin,
    signout
  }
}

export {
  AuthProvider,
  useAuth
}
