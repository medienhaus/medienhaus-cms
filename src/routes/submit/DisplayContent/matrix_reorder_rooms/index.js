import Matrix from '../../../../Matrix'

const reorder = async (name, roomId, minus) => {
  const matrixClient = Matrix.getMatrixClient()
  const title = name.split('_')
  const num = minus ? parseInt(title[0]) - 1 : parseInt(title[0]) + 1
  return await matrixClient.setRoomName(roomId, num + '_' + title[1])
}

export default reorder
