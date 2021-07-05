import { MatrixEvent } from 'matrix-js-sdk'
import Matrix from '../../Matrix'

const powerMove = async (roomId) => {
  const matrixClient = Matrix.getMatrixClient()

  matrixClient.getStateEvent(roomId, 'm.room.power_levels', '').then(async (res) => {
    // after inviting and promoting our bot, the user demotes themself to moderator
    const powerEvent = new MatrixEvent(
      {
        type: 'm.room.power_levels',
        content: res
      }
    )
    try {
      await matrixClient.setPowerLevel(roomId, localStorage.getItem('mx_user_id'), 100, powerEvent)
    } catch (err) {
      console.error(err)
    }
  })
  return roomId
}
export default powerMove
