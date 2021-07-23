
import React, { useState } from 'react'
import { useAuth } from '../../../Auth'
import { useTranslation } from 'react-i18next'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const Profile = () => {
  const { t } = useTranslation('projects')
  const auth = useAuth()
  const profile = auth.user
  const [editDisplayName, setEditDisplayName] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(profile.displayname)
  const matrixClient = Matrix.getMatrixClient()

  const changeDisplayName = async () => {
    await matrixClient.setDisplayName(newDisplayName)
    setEditDisplayName(false)
  }

  return (
    <div className="pofile">
      {profile.avatar_url ? <img className="avatar" src={matrixClient.mxcUrlToHttp(profile.avatar_url, 100, 100, 'crop', true)} alt="avatar" /> : <canvas className="avatar" style={{ backgroundColor: 'black' }} />}
      <div>
        {editDisplayName
          ? <input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} />
          : <p>{t('Hello')}  <strong>{newDisplayName}</strong></p>}
        {/* @Andi */}
        <button onClick={() => {
          if (editDisplayName) setNewDisplayName(profile.displayname)
          setEditDisplayName(editDisplayName => !editDisplayName)
        }}
        >{editDisplayName ? t('cancel') : t('edit name')}
        </button>
        {editDisplayName && <LoadingSpinnerButton onClick={changeDisplayName}>SAVE</LoadingSpinnerButton>}
      </div>
    </div>
  )
}
export default Profile
