import Matrix from '../../../Matrix'

async function deleteContentBlock (name, roomId, index) {
  const matrixClient = Matrix.getMatrixClient()

  const roomType = name.split('_')
  await matrixClient.setRoomName(roomId, 'x_' + roomType[1])
  const count = await matrixClient.getJoinedRoomMembers(roomId)
  Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
    localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(roomId, name)
  })
  await matrixClient.leave(roomId)
} export default deleteContentBlock
