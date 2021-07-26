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
      <input id="title" maxLength="100" name="title" type="text" value={newDisplayName} onClick={(e) => { setEditDisplayName(true) }} onChange={(e) => setNewDisplayName(e.target.value)} />
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
