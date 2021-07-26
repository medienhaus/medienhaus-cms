import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const Name = ({ name }) => {
  const { t } = useTranslation('projects')
  const [editDisplayName, setEditDisplayName] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(name)
  const matrixClient = Matrix.getMatrixClient()

  const changeDisplayName = async () => {
    await matrixClient.setDisplayName(newDisplayName)
    setEditDisplayName(false)
  }

  return (
    <div className="name">
      <div>
        {editDisplayName
          ? <input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} />
          : <p>{t('Hello')} <strong>{newDisplayName}</strong></p>}
        {/* @Andi */}
        <button onClick={() => {
          if (editDisplayName) setNewDisplayName(name)
          setEditDisplayName(editDisplayName => !editDisplayName)
        }}
        >{editDisplayName ? t('cancel') : t('edit name')}
        </button>
        {editDisplayName && <LoadingSpinnerButton onClick={changeDisplayName}>SAVE</LoadingSpinnerButton>}
      </div>
    </div>
  )
}
export default Name
