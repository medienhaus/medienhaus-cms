import Matrix from '../../Matrix'
import { MatrixEvent } from 'matrix-js-sdk'

const promote = async (userId, roomId, powerLevel) => {
  const matrixClient = Matrix.getMatrixClient()

  console.log('changing power level for ' + userId)
  matrixClient.getStateEvent(roomId, 'm.room.power_levels', '').then(async (res) => {
    const powerEvent = new MatrixEvent({
      type: 'm.room.power_levels',
      content: res
    }
    )

    try {
      // something here is going wrong for collab > 2
      await matrixClient.setPowerLevel(roomId, userId, powerLevel, powerEvent)
    } catch (err) {
      console.error(err)
    }
  })
}
export default promote
