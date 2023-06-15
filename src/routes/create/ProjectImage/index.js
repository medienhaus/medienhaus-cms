import React, { useCallback, useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import FileUpload from '../../../components/FileUpload'
import TextareaAutosize from 'react-textarea-autosize'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../../components/loading'
import config from '../../../config.json'

const ProjectImage = ({ projectSpace, changeProjectImage, disabled, apiCallback }) => {
  const [edit, setEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projectImage, setProjectImage] = useState()
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('content')

  const fetchProjectImage = useCallback(async () => {
    setLoading(true)
    const avatar = await matrixClient.getStateEvent(projectSpace, 'm.room.avatar').catch(() => { setProjectImage() })
    avatar && setProjectImage(avatar)
    setLoading(false)
  }, [matrixClient, projectSpace])

  useEffect(() => {
    fetchProjectImage()
  }, [fetchProjectImage, projectSpace])

  const handleSubmission = async (e, selectedFile, fileName, author, license, alt) => {
    e.preventDefault()
    setLoading(true)

    try {
      await matrixClient.uploadContent(selectedFile, { name: fileName })
        .then(async (url) => {
          const req = {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
            body: JSON.stringify({
              url: url.content_uri,
              author: author,
              license: license,
              alt: alt
            })
          }
          await fetch(localStorage.getItem('medienhaus_hs_url') + `_matrix/client/r0/rooms/${projectSpace}/state/m.room.avatar/`, req)
        }).then(async () => {
          await fetchProjectImage()
          changeProjectImage()
        })
      if (config.medienhaus.api) apiCallback()
      return 'success'
    } catch (e) {
      console.log('error while trying to save image: ' + e)
    } finally {
      setLoading(false)
      setEdit(false)
    }
  }

  const fileUpload = <FileUpload fileType="image" handleSubmission={handleSubmission} loading={loading} disabled={disabled} callback={() => setEdit(edit => !edit)} />

  if (loading) return <Loading />
  if (!projectImage) {
    return fileUpload
  }
  return (
    <>
      <img src={matrixClient.mxcUrlToHttp(projectImage.url)} alt={projectImage.alt} />
      {!edit &&
        <>
          <button onClick={e => { e.preventDefault(); setEdit(edit => !edit) }}>{t('CHANGE')}</button>

          <input type="text" value={projectImage.author} disabled />
          <select id="license" name="license" value={projectImage.license} disabled>
            <option value="cc0">CC0 1.0</option>
            <option value="cc-by">CC BY 4.0</option>
            <option value="cc-by-sa">CC BY-SA 4.0</option>
            <option value="cc-by-nc">CC BY-NC 4.0</option>
            <option value="cc-by-nc-sa">CC BY-NC-SA 4.0</option>
            <option value="cc-by-nd">CC BY-ND 4.0</option>
            <option value="cc-by-nc-nd">CC BY-NC-ND 4.0</option>
            <option value="rs-inc">In Copyright</option>
          </select>
          <TextareaAutosize rows="3" value={projectImage.alt} disabled />
        </>}
      {edit && fileUpload}
    </>
  )
}
export default ProjectImage
