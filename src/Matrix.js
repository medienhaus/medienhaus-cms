import matrixcs, { MemoryStore } from 'matrix-js-sdk'

class Matrix {
  constructor () {
    this.baseUrl = localStorage.getItem('medienhaus_hs_url') || process.env.REACT_APP_MATRIX_BASE_URL
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

  login (user, password, homeserver) {
    if (homeserver && homeserver !== this.matrixClient.getHomeserverUrl()) {
      // eslint-disable-next-line new-cap
      this.matrixClient = new matrixcs.createClient({
        baseUrl: homeserver,
        userId: user,
        useAuthorizationHeader: true,
        timelineSupport: true,
        unstableClientRelationAggregation: true
      })
    }
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
    return this.matrixClient.http.authedRequest('PUT', `/rooms/${parent}/state/m.space.child/${child}`, undefined, {})
  }

  async waitForRoom (roomId, maxAttempts = 10, delay = 100) {
    // Wait for the room to be available, sometimes the room is not available immediately after creation
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const room = this.matrixClient.getRoom(roomId)
      if (room) return room
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    throw new Error(`Room ${roomId} not available after ${maxAttempts} attempts`)
  }

  async addSpaceChild (parent, child, autoJoin, suggested) {
    // check if the user has the necessary permissions to add a child to the parent
    // Get the room object
    const room = await this.waitForRoom(parent)

    if (!room) {
      throw new Error(`Room ${parent} not found`)
    }

    const myPowerLevel = room.getMember(this.matrixClient.getUserId()).powerLevel

    const canSendStateEvent = room.currentState.hasSufficientPowerLevelFor(
      'm.space.child',
      myPowerLevel
    )

    if (!canSendStateEvent) throw new Error('Insufficient permissions to add a child to the parent')

    const payload = {
      auto_join: autoJoin || false,
      suggested: suggested || false,
      via: [this.matrixClient.getDomain()]
    }
    // add m.space.parent event
    await this.addSpaceToParent(parent, child)

    return this.matrixClient.http.authedRequest('PUT', `/rooms/${parent}/state/m.space.child/${child}`, undefined, payload)
  }

  addSpaceToParent = async (parent, child) => {
    const room = await this.waitForRoom(child)

    if (!room) {
      throw new Error(`Room ${child} not found`)
    }

    // Get all m.space.parent state events
    const existingParents = room.currentState.getStateEvents('m.space.parent')
    // Check if any existing parent is canonical
    const hasCanonicalParent = existingParents?.some(event => event.getContent().canonical === true)
    // Determine if this new parent should be canonical
    const canonical = !hasCanonicalParent

    // Send m.space.parent event
    await this.matrixClient.sendStateEvent(
      child,
      'm.space.parent',
      {
        via: [this.matrixClient.getDomain()],
        canonical: canonical
      },
      parent
    )

    return {
      success: true,
      message: canonical ? 'Added as canonical parent' : 'Added as non-canonical parent'
    }
  }

  async removeChildFromParent (roomId) {
    const room = this.matrixClient.getRoom(roomId)
    console.log(room)

    if (!room) {
      throw new Error(`Room ${roomId} not found`)
    }

    // Get all m.space.parent events
    const parentEvents = room.currentState.getStateEvents('m.space.parent')
    console.log('parentEvents', parentEvents)
    // Remove the room from each parent space
    for await (const event of parentEvents) {
      const parentId = event.getStateKey()
      try {
        // Remove m.space.child event from the parent space
        await this.matrixClient.sendStateEvent(
          parentId,
          'm.space.child',
          {}, // empty content to remove the event
          roomId
        )

        console.log(`Removed room ${roomId} from space ${parentId}`)
      } catch (error) {
        console.error(`Failed to remove room ${roomId} from space ${parentId}:`, error)
        // Continue with other parent spaces even if one fails
      }
    }
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

  createRoom = async (name, isSpace, topic, joinRule, type, template) => {
    const opts = {
      name: name,
      preset: 'private_chat',
      topic: topic,
      visibility: 'private', // by default we want rooms and spaces to be private, this can later be changed either in /content or /moderate
      creation_content: {
        type: isSpace ? 'm.space' : 'm.room'
      },
      initial_state: [{
        type: 'm.room.history_visibility',
        content: { history_visibility: 'world_readable' } // history has to be world_readable so content of the rooms is visible for everyone who joins the room at a later point in time
      },
      {
        type: 'm.room.join_rules',
        content: { join_rule: joinRule } // can be set to either public, invite or knock
      }],
      power_level_content_override: {
      // we only want users with moderation rights to be able to do any actions, people joining the room will have a default level of 0.
        ban: 50,
        events: {
          'm.room.name': 50,
          'm.room.power_levels': 50
        },
        events_default: 50,
        invite: 50,
        kick: 50,
        notifications: {
          room: 20
        },
        redact: 50,
        state_default: 50,
        users_default: 0
      }
    }

    const room = await this.matrixClient.createRoom(opts)
    const medienhausMetaEvent = {
      type: type,
      template: template,
      version: '0.4'
    }
    await this.matrixClient.sendStateEvent(room.room_id, 'dev.medienhaus.meta', medienhausMetaEvent)
    return room
  }

  knockOnMatrixRoom = (roomId) => this.matrixClient.http.authedRequest('POST', `/knock/${roomId}`, undefined, {})
}

export default new Matrix()
