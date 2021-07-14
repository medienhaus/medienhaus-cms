import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import FileUpload from '../../../components/FileUpload'

const ProjectImage = ({ projectSpace, projectImage, changeProjectImage, imgAuthor, imgLicense, imgAlt }) => {
  const [edit, setEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  const handleSubmission = async (e, selectedFile, fileName, author, license, alt) => {
    e.preventDefault()
    setLoading(true)

    try {
      await matrixClient.uploadContent(selectedFile, { name: fileName })
        .then((url) => {
          changeProjectImage(url, author, license, alt)
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
    <>
      {projectImage
        ? <>
          <img src={matrixClient.mxcUrlToHttp(projectImage)} alt="Project-key-visual" />
          <button onClick={e => { e.preventDefault(); setEdit(edit => !edit) }}>{edit ? 'CANCEL' : 'CHANGE'}</button>
          {imgAuthor && <input type="text" placeholder="author, credits, et cetera" value={imgAuthor} disabled />}
          {imgLicense && <>
            <select id="license" name="license" value={imgLicense} disabled>
              <option value="cc0">CC0 1.0</option>
              <option value="cc-by">CC BY 4.0</option>
              <option value="cc-by-sa">CC BY-SA 4.0</option>
              <option value="cc-by-nc">CC BY-NC 4.0</option>
              <option value="cc-by-nc-sa">CC BY-NC-SA 4.0</option>
              <option value="cc-by-nd">CC BY-ND 4.0</option>
              <option value="cc-by-nc-nd">CC BY-NC-ND 4.0</option>
            </select>
          </>}
          {imgAlt && <textarea rows="3" value={imgAlt} disabled />}
          {edit && <FileUpload fileType="image" handleSubmission={handleSubmission} loading={loading} />}
        </>
        : (
          <FileUpload fileType="image" handleSubmission={handleSubmission} loading={loading} />
          )}
    </>
  )
}
export default ProjectImage
