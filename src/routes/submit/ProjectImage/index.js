import React, { useCallback, useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import FileUpload from '../../../components/FileUpload'
import TextareaAutosize from 'react-textarea-autosize'
import { useTranslation } from 'react-i18next'

const ProjectImage = ({ projectSpace, changeProjectImage }) => {
  const [edit, setEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projectImage, setProjectImage] = useState()
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('projects')

  const fetchProjectImage = useCallback(async () => {
    const avatar = await matrixClient.getStateEvent(projectSpace, 'm.room.avatar')
      .catch(res => {
        res.data.error === 'Event not found.' && console.log('No Avatar set, yet')
      })
    avatar && setProjectImage(avatar)
  }, [matrixClient, projectSpace])

  useEffect(() => {
    fetchProjectImage()
  }, [fetchProjectImage, projectSpace])

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
            body: JSON.stringify({
              url: url,
              author: author,
              license: license,
              alt: alt
            })
          }
          fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.room.avatar/`, req)
        }).then((res) => {
          fetchProjectImage()
        })
      return 'success'
    } catch (e) {
      console.log('error while trying to save image: ' + e)
    } finally {
      setLoading(false)
      setEdit(false)
    }
  }

  const fileUpload = <FileUpload fileType="image" handleSubmission={handleSubmission} loading={loading} />

  if (!projectImage) {
    return fileUpload
  }

  return (
    <>
      <>
        <img src={matrixClient.mxcUrlToHttp(projectImage.url)} alt={projectImage.alt} />
        <button onClick={e => { e.preventDefault(); setEdit(edit => !edit) }}>{edit ? t('CANCEL') : t('CHANGE')}</button>
        {!edit &&
          <>
            <input type="text" value={projectImage.author} disabled />
            <select id="license" name="license" value={projectImage.license} disabled>
              <option value="cc0">CC0 1.0</option>
              <option value="cc-by">CC BY 4.0</option>
              <option value="cc-by-sa">CC BY-SA 4.0</option>
              <option value="cc-by-nc">CC BY-NC 4.0</option>
              <option value="cc-by-nc-sa">CC BY-NC-SA 4.0</option>
              <option value="cc-by-nd">CC BY-ND 4.0</option>
              <option value="cc-by-nc-nd">CC BY-NC-ND 4.0</option>
            </select>
            <TextareaAutosize rows="3" value={projectImage.alt} disabled />
          </>}
        {edit && fileUpload}
      </>
    </>
  )
}
export default ProjectImage
