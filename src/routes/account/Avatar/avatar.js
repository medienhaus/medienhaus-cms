import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import Matrix from '../../../Matrix'

const Avatar = ({ avatarUrl, name }) => {
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl)
  const [changeAvatar, setChangeAvatar] = useState(false)
  const [selectedFile, setSelectedFile] = useState()
  const [src, setSrc] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation()

  useEffect(() => {
    // if (currentAvatar) setSrc(matrixClient.mxcUrlToHttp(currentAvatar, 1000, 1000, 'crop', true))
    if (currentAvatar) setSrc(matrixClient.mxcUrlToHttp(currentAvatar))
  }, [currentAvatar, matrixClient])

  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0])
  }

  const handleSubmission = async () => {
    await matrixClient.uploadContent(selectedFile, { name: selectedFile.name })
      .then(async (url) => {
        await matrixClient.setAvatarUrl(url?.content_uri)
        return url?.content_uri
      })
      .then((url) => setCurrentAvatar(url))
      .then(() => setChangeAvatar(false))
  }

  return (

    <div className="profile-image">
      <h3>Profile image</h3>
      <p>Here you can change your profile image.</p>
      {currentAvatar ? <img className="avatar" src={src} alt={`profile avatar of ${name}`} /> : <canvas className="avatar" />}
      {!changeAvatar &&
        <button onClick={() => {
          setChangeAvatar(true)
        }}
        >{t('CHANGE')}
        </button>}
      {changeAvatar && (
        <>
          <input className="browse" type="file" name="browse" onChange={changeHandler} />
          <div className="confirmation">
            <button
              className="cancel"
              onClick={() => {
                setChangeAvatar(false)
              }}
            >{t('CANCEL')}
            </button>
            <LoadingSpinnerButton className="confirm" disabled={!selectedFile || !selectedFile.type.includes('image')} onClick={handleSubmission}>{t('UPLOAD')}</LoadingSpinnerButton>
          </div>
          {selectedFile && !selectedFile.type.includes('image') && <p>❗️ {t('Please select an image file')}</p>}
        </>
      )}
    </div>
  )
}
export default Avatar
