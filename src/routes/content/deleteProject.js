import Matrix from '../../Matrix'
import config from '../../config.json'
import { removeFromParent } from '../../helpers/MedienhausApiHelper'

const deleteProject = async (roomId) => {
  const matrixClient = Matrix.getMatrixClient()
  let log
  try {
    // we change the meta json to reflect the deleted space
    const meta = await matrixClient.getStateEvent(roomId, 'dev.medienhaus.meta').catch(console.log)
    meta.deleted = true
    await matrixClient.sendStateEvent(roomId, 'dev.medienhaus.meta', meta)
    const space = await matrixClient.getRoomHierarchy(roomId).catch(console.log)
    space.rooms.filter(room => room.room_id !== roomId).forEach(async (space, index) => {
      // we reverse here to leave the actual project space last in case something goes wrong in the process.
      console.log('Leaving ' + space.name)
      const subspaces = await matrixClient.getRoomHierarchy(space.room_id).catch(console.log)
      subspaces.rooms.reverse().forEach(async (space) => {
        const count = await matrixClient.getJoinedRoomMembers(space.room_id)
        Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
          localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(space.room_id, name).catch(console.log)
        })
        await matrixClient.leave(space.room_id).catch(console.log)
      })
      const count = await matrixClient.getJoinedRoomMembers(space.room_id)
      Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(async name => {
        localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(space.room_id, name).catch(console.log)
      })
      await matrixClient.leave(space.room_id).catch(console.log)
    })
    await matrixClient.leave(roomId).catch(console.log)
    if (config.medienhaus.api) await removeFromParent(roomId, [], true)
    log = 'successfully deleted ' + roomId
  } catch (err) {
    log = err
  }
  return log
}
export default deleteProject
