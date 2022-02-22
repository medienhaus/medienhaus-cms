import matrixcs, { MemoryStore } from 'matrix-js-sdk'

class Matrix {
  constructor () {
    const myAccessToken = localStorage.getItem('medienhaus_access_token')
    const myUserId = localStorage.getItem('medienhaus_user_id')

    // eslint-disable-next-line new-cap
    this.matrixClient = new matrixcs.createClient({
      baseUrl: process.env.REACT_APP_MATRIX_BASE_URL,
      accessToken: myAccessToken,
      userId: myUserId,
      useAuthorizationHeader: true,
      timelineSupport: true,
      unstableClientRelationAggregation: true,
      store: new MemoryStore({ localStorage })
    })
  }

  // @TODO Replace all calls of this with custom Matrix.function() wrapper functions for all calls that we make use of
  getMatrixClient () {
    return this.matrixClient
  }

  login (user, password) {
    return this.matrixClient.login('m.login.password', {
      type: 'm.login.password',
      user: user,
      password: password
    })
  }

  loginWithToken (token) {
    return this.matrixClient.loginWithToken(token)
  }

  startSync () {
    this.matrixClient.startClient()
    this.matrixClient.setMaxListeners(500)
  }
}

export default new Matrix()
