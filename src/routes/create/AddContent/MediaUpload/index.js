import React, { useState } from 'react'
import Matrix from '../../../../Matrix'
import createBlock from '../../matrix_create_room'
import reorder from '../../DisplayContent/matrix_reorder_rooms'
import FileUpload from '../../../../components/FileUpload'

const MediaUpload = (props) => {
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  const handleSubmission = async (e, selectedFile, fileName, author, license, alttext) => {
    e.preventDefault()
    setLoading(true)
    let room
    try {
      await matrixClient.uploadContent(selectedFile, { name: fileName })
        .then(async (url) => {
          props.blocks.forEach((block, i) => {
            if (i >= props.number) {
              console.log(block.name)
              reorder(block.name, block.room_id, props.space, false)
            }
          })
          const room = await createBlock(e, props.fileType, props.number, props.space)
          console.log('room = ' + room)
          return [url, room]
        }).then((res) => {
          props.fileType === 'image'
            ? matrixClient.sendImageMessage(res[1], res[0], {
              mimetype: selectedFile.type,
              size: selectedFile.size,
              name: selectedFile.name,
              author: author,
              license: license,
              alt: alttext
            })
            : matrixClient.sendMessage(res[1], {
              body: selectedFile.name,
              info: {
                size: selectedFile.size,
                mimetype: selectedFile.type,
                name: selectedFile.name,
                author: author,
                license: license,
                alt: alttext
              },
              msgtype: 'm.audio',
              url: res[0]
            })
          room = res[1]
        }
        )
      props.displayPlusButton(true)
      props.reloadSpace(room)
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
    <FileUpload fileType={props.fileType} handleSubmission={handleSubmission} loading={loading} callback={() => props.displayPlusButton(true)} />
  )
}

export default MediaUpload
