import Matrix from '../../Matrix'
import config from '../../config.json'
import { removeFromParent } from '../../helpers/MedienhausApiHelper'

const deleteProject = async (roomId) => {
  const matrixClient = Matrix.getMatrixClient()
  let log

  try {
    // Update meta json to reflect the deleted space, this ensures that the space will be deleted for collaborators
    const meta = await matrixClient.getStateEvent(roomId, 'dev.medienhaus.meta')
    meta.deleted = true
    await matrixClient.sendStateEvent(roomId, 'dev.medienhaus.meta', meta)

    // Get room hierarchy
    const space = await Matrix.roomHierarchy(roomId)

    // Process each room in the hierarchy from bottom to top
    const allRooms = space.filter(room => room.room_id !== roomId)
    for (const room of allRooms.reverse()) {
      console.log('Processing ' + room.name)
      await processRoom(matrixClient, room.room_id, roomId)
    }

    // Leave the main project room
    await matrixClient.leave(roomId)

    // Remove from parent if API is configured
    if (config.medienhaus.api) {
      await removeFromParent(roomId, [], true)
    }

    log = 'Successfully deleted ' + roomId
  } catch (err) {
    log = 'Error deleting project: ' + err.message
  }

  return log
}

// Helper function to process a room
const processRoom = async (matrixClient, roomId, parentRoomId) => {
  try {
    const currentUserId = matrixClient.getUserId()
    const members = await matrixClient.getJoinedRoomMembers(roomId)

    // Kick other members
    for (const memberId of Object.keys(members.joined)) {
      if (memberId !== currentUserId) {
        await matrixClient.kick(roomId, memberId).catch(console.error)
      }
    }

    // Remove child from parent
    await Matrix.removeSpaceChild(parentRoomId, roomId)

    // Leave the room if we haven't already
    await matrixClient.leave(roomId).catch(console.error)
  } catch (error) {
    console.error(`Error processing room ${roomId}:`, error)
  }
}
export default deleteProject
