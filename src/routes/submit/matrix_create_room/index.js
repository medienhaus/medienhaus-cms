import powerMove from '../../../components/matrix_power_move'
import Matrix from '../../../Matrix'

const createBlock = async (e, content, number, space) => {
  const matrixClient = Matrix.getMatrixClient()
  if (e) {
    e.preventDefault()
  }

  const opts = {
    name: (number) + '_' + content, // blocks[0] is the project space itself, therefore -1
    preset: 'public_chat',
    topic: JSON.stringify({
      type: content
    }),
    creation_content: { 'm.federate': false },
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
    }],
    power_level_content_override: {
      "ban": 50,
      "events": {
        "m.room.name": 50,
        "m.room.power_levels": 50
      },
      "events_default": 0,
      "invite": 50,
      "kick": 50,
      "notifications": {
        "room": 20
      },
      "redact": 50,
      "state_default": 50,
      "users_default": 0

    }
  }

  const req = {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
    body: JSON.stringify({
      via: [localStorage.getItem('mx_home_server')],
      suggested: false,
      auto_join: true
    })
  }

  try {
    const room = await matrixClient.createRoom(opts)
      .then(async (res) => {
        const room_id = res.room_id
        const response = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${space}/state/m.space.child/${room_id}`, req)
        return [room_id, response]
      })
      .then(async (res) => {
        const data = await res[1].json()
        if (!res[1].ok) {
          const error = (data?.message) || res[1].status
          return Promise.reject(error)
        }
        return res[0]
      }).then(async (roomId) => {
        return await powerMove(roomId)
      })
    return room
  } catch (e) {
    console.log(e)
  }
}
export default createBlock
