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
      <h3>Profile name</h3>
      <p>Here you can change your profile name.</p>
      <input id="title" maxLength="100" name="title" type="text" value={newDisplayName} onChange={(e) => { setEditDisplayName(true); setNewDisplayName(e.target.value) }} />
      <div className="confirmation">
        {editDisplayName &&
          <>
            <button
              className="cancel"
              onClick={() => {
                if (editDisplayName) setNewDisplayName(name)
                setEditDisplayName(editDisplayName => !editDisplayName)
              }}
            >{editDisplayName ? t('cancel') : t('edit name')}
            </button>
            <LoadingSpinnerButton className="confirm" onClick={changeDisplayName}>SAVE</LoadingSpinnerButton>
          </>}
      </div>
    </div>
  )
}
export default Name
