import Matrix from '../../../../Matrix'

const reorder = (name, room_id, minus) => {
    const matrixClient = Matrix.getMatrixClient()
    const title = name.split('_')
    const num = minus ? parseInt(title[0]) - 1 :  parseInt(title[0]) + 1 
    new Promise(async (resolve, reject) => {
        try {
            await matrixClient.setRoomName(room_id, num + '_' + title[1]).then(resolve ('changed order'))
        } catch (err) {
            reject(new Error(err))
        }
    })
}
  export default reorder