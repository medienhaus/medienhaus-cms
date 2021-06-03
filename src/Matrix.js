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
    }).then((response) => {
      // Set localStorage items for medienhaus/
      localStorage.setItem('medienhaus_access_token', response.access_token)
      localStorage.setItem('medienhaus_user_id', response.user_id)

      // Set localStorage items for the Element client to automatically be logged-in
      localStorage.setItem('mx_access_token', response.access_token)
      localStorage.setItem('mx_home_server', response.home_server)
      localStorage.setItem('mx_hs_url', response.well_known['m.homeserver'].base_url)
      localStorage.setItem('mx_user_id', response.user_id)
      localStorage.setItem('mx_device_id', response.device_id)
    }).catch((error) => {
      throw error
    })
  }
}

export default new Matrix()
