import React, { useState } from 'react'
import Matrix from '../../../../Matrix'
import createBlock from '../../matrix_create_room'
import reorder from '../../DisplayContent/matrix_reorder_rooms'
import FileUpload from '../../../../components/FileUpload'

const MediaUpload = (props) => {
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  console.log(props)

  const handleSubmission = async (e, selectedFile, fileName) => {
    e.preventDefault()
    setLoading(true)
    try {
      await matrixClient.uploadContent(selectedFile, { name: fileName })
        .then(async (url) => {
          props.blocks.forEach((block, i) => {
            if (i >= props.number) {
              console.log(block.name)
              reorder(block.name, block.room_id, false)
            }
          })
          const room = await createBlock(e, props.fileType, props.number, props.space)
          console.log('room = ' + room)
          return [url, room]
        }).then((res) =>
          props.fileType === 'image'
            ? matrixClient.sendImageMessage(res[1], res[0], {
              mimetype: selectedFile.type,
              size: selectedFile.size,
              name: selectedFile.name
            })
            : matrixClient.sendMessage(res[1], {
              body: selectedFile.name,
              info: {
                size: selectedFile.size,
                mimetype: selectedFile.type
              },
              msgtype: 'm.audio',
              url: res[0]
            })
        )
        .then(console.log)
      props.displayPlusButton(true)
      props.reloadProjects('callback from FileUpload component')
      setLoading(false)

      // setCounter(0)
      // })
    } catch (e) {
      console.log('error while trying to save image: ' + e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FileUpload fileType={props.fileType} handleSubmission={handleSubmission} loading={loading} />
  )
}

export default MediaUpload
