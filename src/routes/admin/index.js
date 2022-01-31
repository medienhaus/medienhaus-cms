import React, { useEffect, useState } from 'react'
import { Loading } from '../../components/loading'
import Matrix from '../../Matrix'

import { useTranslation, Trans } from 'react-i18next'
import ManageContexts from './components/ManageContexts'

// import { useAuth } from '../../Auth'

// const auth = useAuth()

const Admin = () => {
  const [admin, setAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation('admin')

  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    const checkAdminPriviliges = async () => {
      setLoading(true)
      setAdmin(await matrixClient.isSynapseAdministrator().catch(console.log))
      console.log(admin ? 'you are a server admin' : 'you are not a server admin')
      setLoading(false)
    }
    checkAdminPriviliges()
  }, [admin, matrixClient])

  if (!matrixClient || loading) return <Loading />
  if (!admin) return <Trans t={t} i18nKey="adminPriviliges">You need admin priviliges to see this page.</Trans>

  return (
    <>
      <section className="admin">
        <ManageContexts matrixClient={matrixClient} />
      </section>
    </>
  )
}

export default Admin
