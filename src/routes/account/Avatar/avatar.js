
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import Matrix from '../../../Matrix'

const Avatar = ({ avatarUrl }) => {
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl)
  const [changeAvatar, setChangeAvatar] = useState(false)
  const [selectedFile, setSelectedFile] = useState()
  const [src, setSrc] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation()

  useEffect(() => {
    if (currentAvatar) setSrc(matrixClient.mxcUrlToHttp(currentAvatar, 100, 100, 'crop', true))
  }, [currentAvatar, matrixClient])

  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0])
  }

  const handleSubmission = async () => {
    await matrixClient.uploadContent(selectedFile, { name: selectedFile.name })
      .then(async (url) => {
        await matrixClient.setAvatarUrl(url)
        return url
      })
      .then((url) => setCurrentAvatar(url))
  }

  return (
    <div>
      {currentAvatar ? <img className="avatar" src={src} alt="avatar" /> : <canvas className="avatar" style={{ backgroundColor: 'black' }} />}
      <button onClick={() => {
        setChangeAvatar(changeAvatar => !changeAvatar)
      }}
      >{changeAvatar ? t('CANCEL') : t('CHANGE')}
      </button>
      {changeAvatar && (
        <>
          <input className="browse" type="file" name="browse" onChange={changeHandler} />
          <LoadingSpinnerButton disabled={!selectedFile || !selectedFile.type.includes('image')} onClick={handleSubmission}>{t('UPLOAD')}</LoadingSpinnerButton>
          {selectedFile && !selectedFile.type.includes('image') && <p>❗️ {t('Please select an image file')}</p>}
        </>
      )}
    </div>
  )
}
export default Avatar
