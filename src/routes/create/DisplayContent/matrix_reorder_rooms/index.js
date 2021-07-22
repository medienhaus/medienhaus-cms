import Matrix from '../../../../Matrix'

const reorder = async (name, roomId, minus) => {
  const matrixClient = Matrix.getMatrixClient()
  const title = name.split('_')
  const num = minus ? parseInt(title[0]) - 1 : parseInt(title[0]) + 1
  try {
    await matrixClient.setRoomName(roomId, num + '_' + title[1]).then('changed order')
  } catch (err) {
    console.error(err)
  }
}
export default reorder
