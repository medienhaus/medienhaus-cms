import React, { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Loading } from '../../../../components/loading'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'
import deleteProject from '../../deleteProject'

const DeleteProjectButton = ({ roomId, name, index, toggleDeleteButton, removeProject }) => {
  const [leaving, setLeaving] = useState(false)
  const isMounted = useRef(true)

  const { t } = useTranslation('projects')

  useEffect(() => {
    // needed to add this cleanup useEffect to prevent memory leaks
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  return (
    <>
      {leaving && <Loading />}
      <p>
        <Trans t={t} i18nKey="deleteConfirmation">Are you sure you want to delete the project <strong>{{ name }}</strong>?
          This cannot be undone and will delete the project for you and any collaborator(s) that might be part of it.
        </Trans>
      </p>
      <div className="confirmation">
        <button className="cancel" onClick={() => toggleDeleteButton()}>{t('CANCEL')}</button>
        <LoadingSpinnerButton
          className="confirm"
          disabled={leaving}
          onClick={async () => {
            setLeaving(true)
            await deleteProject(roomId)
              .then(() => removeProject(index))
              .then(() => toggleDeleteButton())
              .catch(err => console.log(err))
              .finally(() => {
                if (isMounted.current) {
                  setLeaving(false)
                }
              })
          }}
        >{t('DELETE')}
        </LoadingSpinnerButton>
      </div>
    </>
  )
}

export default DeleteProjectButton
