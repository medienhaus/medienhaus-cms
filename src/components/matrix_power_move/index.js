import { MatrixEvent } from 'matrix-js-sdk'
import Matrix from '../../Matrix'

const powerMove = async (roomId) => {
  const matrixClient = Matrix.getMatrixClient()

  const inviteBot = async (roomId) => {
    await matrixClient.invite(roomId, process.env.REACT_APP_PROJECT_BOT_ACCOUNT)
    const stateEvent = matrixClient.getRoom(roomId)
    await matrixClient.setPowerLevel(roomId, process.env.REACT_APP_PROJECT_BOT_ACCOUNT, 100, stateEvent.currentState.getStateEvents('m.room.power_levels', ''))
  }

  inviteBot(roomId).then(() => matrixClient.getStateEvent(roomId, 'm.room.power_levels', '')).then(async (res) => {
    // after inviting and promoting our bot, the user demotes themself to moderator
    const powerEvent = new MatrixEvent(
      {
        type: 'm.room.power_levels',
        content: res
      }
    )
    try {
      await matrixClient.setPowerLevel(roomId, localStorage.getItem('mx_user_id'), 50, powerEvent)
    } catch (err) {
      console.error(err)
    }
  })
  return roomId
}
export default powerMove
