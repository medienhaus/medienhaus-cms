import Matrix from '../../../../Matrix'

const reorder = async (name, roomId, parent, minus) => {
  const matrixClient = Matrix.getMatrixClient()
  let order = await matrixClient.getStateEvent(parent, 'dev.medienhaus.order').catch(console.log)
  order = order.order
  const indexOfRoom = order.indexOf(roomId)
  console.log(indexOfRoom)
  order = order.splice(indexOfRoom, 1) // remove from old position
  order = order.splice(minus ? indexOfRoom - 1 : indexOfRoom + 1, 0, roomId) // insert at new one
  await matrixClient.sendStateEvent(parent, 'dev.medienhaus.order', { order: order })
  const title = name.split('_')
  const num = minus ? parseInt(title[0]) - 1 : parseInt(title[0]) + 1
  try {
    await matrixClient.setRoomName(roomId, num + '_' + title[1]).then('changed order')
  } catch (err) {
    console.error(err)
  }
}
export default reorder
