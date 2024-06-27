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
    creation_content: { type: 'm.space' },
    initial_state: [{
      type: 'm.space.parent',
      content: {
        via: [localStorage.getItem('mx_home_server')],
        canonical: true
      },
      state_key: space
    },
    {
      type: 'dev.medienhaus.meta',
      content: {
        type: 'content',
        template: content,
        version: '0.4',
        application: process.env.REACT_APP_APP_NAME
      }
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

  try {
    const room = await matrixClient.createRoom(opts)
      .then(async (res) => {
        const response = await Matrix.addSpaceChild(space, res.room_id)
        if (!response.event_id) {
          return Promise.reject(new Error('Something went wrong while trying to add space child'))
        }
        return res.room_id
      })
      .then(async (res) => {
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
