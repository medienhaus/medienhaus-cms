import matrixcs, { MemoryStore } from 'matrix-js-sdk'

class Matrix {
  constructor (baseUrl) {
    this.baseUrl = baseUrl
    const myAccessToken = localStorage.getItem('medienhaus_access_token')
    const myUserId = localStorage.getItem('medienhaus_user_id')

    // eslint-disable-next-line new-cap
    this.matrixClient = new matrixcs.createClient({
      baseUrl: this.baseUrl,
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

  removeSpaceChild (parent, child) {
    return this.matrixClient.http.authedRequest(undefined, 'PUT', `/rooms/${parent}/state/m.space.child/${child}`, undefined, {})
  }

  addSpaceChild (parent, child, autoJoin, suggested) {
    const payload = {
      auto_join: autoJoin || false,
      suggested: suggested || false,
      via: [process.env.REACT_APP_MATRIX_BASE_URL.replace('https://', '')]
    }
    return this.matrixClient.http.authedRequest(undefined, 'PUT', `/rooms/${parent}/state/m.space.child/${child}`, undefined, payload)
  }

  roomHierarchy = async (roomId, limit, maxDepth, suggestedOnly) => {
    const rooms = []

    const fetchHierarchyFromMatrix = async (fromToken) => {
      const hierarchy = await this.matrixClient.getRoomHierarchy(roomId, limit, maxDepth, suggestedOnly, fromToken)
      rooms.push(...hierarchy.rooms)
      if (hierarchy.next_batch) await fetchHierarchyFromMatrix(hierarchy.next_batch)
      return rooms
    }
    await fetchHierarchyFromMatrix()
    return rooms
  }
}
export default new Matrix()
