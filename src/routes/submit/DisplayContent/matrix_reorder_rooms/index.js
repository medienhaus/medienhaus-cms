import Matrix from '../../../../Matrix'

const reorder = (name, roomId, minus) => {
  const matrixClient = Matrix.getMatrixClient()
  const title = name.split('_')
  const num = minus ? parseInt(title[0]) - 1 : parseInt(title[0]) + 1
  Promise(async (resolve, reject) => {
    try {
      await matrixClient.setRoomName(roomId, num + '_' + title[1]).then(resolve('changed order'))
    } catch (err) {
      reject(new Error(err))
    }
  })
}
export default reorder
