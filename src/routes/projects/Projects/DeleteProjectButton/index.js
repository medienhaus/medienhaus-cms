import React, { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Loading } from '../../../../components/loading'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'

const DeleteProjectButton = ({ roomId, name, index, deleteProject, reloadProjects }) => {
  const [warning, setWarning] = useState(false)
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
            <LoadingSpinnerButton
                disabled={leaving}
                onClick={async () => {
                  if (warning) {
                    setLeaving(true)
                    await deleteProject(null, roomId)
                      .then(() => reloadProjects(index))
                      .catch(err => console.log(err))
                      .finally(() => {
                        if (isMounted.current) {
                          setLeaving(false)
                        }
                      })
                    setWarning(false)
                  } else {
                    setWarning(true)
                  }
                }} >{warning ? t('Yes, delete project') : t('DELETE')}</LoadingSpinnerButton>

            {leaving && <Loading />}
            {warning && <p>
                <Trans t={t} i18nKey="deleteConfirmation">Are you sure you want to delete the project <strong>{{ name }}</strong>?
                    This cannot be undone and will delete the project for you and any collaborator(s) that might be part of it.
                </Trans>
            </p>}
            {warning &&
                <button onClick={() => { setWarning(false) }}>{t('CANCEL')}</button>
            }
        </>
  )
}
export default DeleteProjectButton
