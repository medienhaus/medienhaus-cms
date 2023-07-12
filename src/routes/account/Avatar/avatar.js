import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import Matrix from '../../../Matrix'
import { fileHandler } from '../../../helpers/fileHandler'

const Avatar = ({ avatarUrl, name }) => {
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl)
  const [changeAvatar, setChangeAvatar] = useState(false)
  const [selectedFile, setSelectedFile] = useState()
  const [errorMessage, setErrorMessage] = useState('')
  const [src, setSrc] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('content')
  const fileTypes = [
    'image/gif',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]

  useEffect(() => {
    // if (currentAvatar) setSrc(matrixClient.mxcUrlToHttp(currentAvatar, 1000, 1000, 'crop', true))
    if (currentAvatar) setSrc(matrixClient.mxcUrlToHttp(currentAvatar))
  }, [currentAvatar, matrixClient])

  const changeHandler = async (event) => {
    setErrorMessage('')
    const checkFile = await fileHandler(event.target.files[0], 'image')
      .catch(async error => {
        setErrorMessage(error.message)
        await new Promise(resolve => setTimeout(resolve, 3000))
        setErrorMessage('')
      })
    if (checkFile !== undefined) setSelectedFile(event.target.files[0])
  }

  const handleSubmission = async () => {
    // @TODO use fileUpload component
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
      <h3>{t('Profile image')}</h3>
      <p>{t('Here you can change your profile image.')}</p>
      {currentAvatar ? <img className="avatar" src={src} alt={`profile avatar of ${name}`} /> : <canvas className="avatar" />}
      {!changeAvatar &&
        <button onClick={() => {
          setChangeAvatar(true)
        }}
        >{t('CHANGE')}
        </button>}
      {changeAvatar && (
        <>
          <input className="browse" type="file" name="browse" accept={fileTypes} onChange={changeHandler} />
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
          {errorMessage && <p>❗️ {errorMessage}</p>}
        </>
      )}
    </div>
  )
}
export default Avatar
