
import Matrix from '../../../Matrix'

const createBlock = async (e, content, number, space) => {
  const matrixClient = Matrix.getMatrixClient()
  if (e) e.preventDefault()
  const name = content ? (number) + '_' + content : (number)
  console.log(name)
  const opts = {
    name: name,
    room_version: '7',
    preset: 'private_chat',
    topic: '',
    initial_state: [{
      type: 'm.space.parent',
      content: {
        via: [localStorage.getItem('mx_home_server')],
        canonical: true
      },
      state_key: space
    }, {
      type: 'm.room.history_visibility',
      content: { history_visibility: 'world_readable' }
    },
    {
      type: 'm.room.join_rules',
      content: { join_rule: 'invite' }
    }],
    power_level_content_override: {
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

  const req = {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
    body: JSON.stringify({
      via: [localStorage.getItem('mx_home_server')],
      suggested: false,
      auto_join: false
    })
  }

  try {
    const room = await matrixClient.createRoom(opts)
      .then(async (res) => {
        const roomId = res.room_id
        const response = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${space}/state/m.space.child/${roomId}`, req)
        return [roomId, response]
      })
      .then(async (res) => {
        const data = await res[1].json()
        if (!res[1].ok) {
          const error = (data?.message) || res[1].status
          return Promise.reject(error)
        }
        await matrixClient.sendStateEvent(res[0], 'dev.medienhaus.meta', {
          type: 'content',
          template: content,
          version: '0.4'
        })
        return res[0]
      }).then(async (res) => {
        let currentOrder = await matrixClient.getStateEvent(space, 'dev.medienhaus.order').catch(console.log)
        if (currentOrder) {
          currentOrder = currentOrder.order
          currentOrder.splice(number, 0, res)
        }
        await matrixClient.sendStateEvent(space, 'dev.medienhaus.order', currentOrder ? { order: currentOrder } : { order: [res] })
        return res
      })
    return room
  } catch (e) {
    console.log(e)
  }
}
export default createBlock
