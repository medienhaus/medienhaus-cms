import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const Name = ({ name, callback }) => {
  const { t } = useTranslation('content')
  const [editDisplayName, setEditDisplayName] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(name)
  const matrixClient = Matrix.getMatrixClient()

  const changeDisplayName = async () => {
    await matrixClient.setDisplayName(newDisplayName)
    callback(newDisplayName)
    setEditDisplayName(false)
  }

  return (
    <div className="name">
      <h3>{t('Profile name')}</h3>
      <p>{t('The profile name is the name that appears under your projects on the public-facing Rundgang website.')}</p>
      <input id="title" maxLength="100" name="title" type="text" value={newDisplayName} onChange={(e) => { setEditDisplayName(true); setNewDisplayName(e.target.value) }} />
      <div className="confirmation">
        {editDisplayName && (name !== newDisplayName) &&
          <>
            <button
              className="cancel"
              onClick={() => {
                if (editDisplayName) setNewDisplayName(name)
                setEditDisplayName(editDisplayName => !editDisplayName)
              }}
            >{editDisplayName ? t('cancel') : t('edit name')}
            </button>
            <LoadingSpinnerButton className="confirm" onClick={changeDisplayName}>{t('SAVE')}</LoadingSpinnerButton>
          </>}
      </div>
    </div>
  )
}
export default Name
