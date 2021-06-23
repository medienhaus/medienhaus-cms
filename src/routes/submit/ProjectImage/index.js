import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import FileUpload from '../../../components/FileUpload'

const ProjectImage = ({ projectSpace, projectImage, changeProjectImage }) => {
  const [edit, setEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  const handleSubmission = async (e, selectedFile, fileName) => {
    e.preventDefault()
    setLoading(true)
    try {
      await matrixClient.uploadContent(selectedFile, { name: fileName })
        .then((url) => {
          changeProjectImage(url)
          const req = {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
            body: JSON.stringify({ url: url })
          }
          fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.room.avatar/`, req)
        }).then(console.log)
      return 'success'
    } catch (e) {
      console.log('error while trying to save image: ' + e)
    } finally {
      setLoading(false)
      setEdit(false)
    }
  }

  return (
    <div>
      {projectImage
        ? <>
          <img src={matrixClient.mxcUrlToHttp(projectImage)} alt="Project-key-visual" />
          <button onClick={e => { e.preventDefault(); setEdit(edit => !edit) }}>CHANGE</button>
          {edit && <FileUpload fileType="image" handleSubmission={handleSubmission} loading={loading} />}
          </>
        : (
          <>
            Add a project image <FileUpload fileType="image" handleSubmission={handleSubmission} loading={loading} />
          </>
          )}
    </div>
  )
}
export default ProjectImage
