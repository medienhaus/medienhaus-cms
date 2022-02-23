import React, { useEffect, useState } from 'react'
import { Loading } from '../../components/loading'
import Matrix from '../../Matrix'

import AddUser from './components/AddUser'
import ChangePassword from './components/ChangePassword'
import DeleteUser from './components/DeleteUser'
import { useTranslation, Trans } from 'react-i18next'

const Admin = () => {
  const [admin, setAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selection, setSelection] = useState('add')
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

  const renderSelection = () => {
    switch (selection) {
      case 'password':
        return <ChangePassword />
      case 'delete':
        return <DeleteUser />
      default:
        return <AddUser matrixClient={matrixClient} />
    }
  }

  if (!matrixClient || loading) return <Loading />
  if (!admin) return <Trans t={t} i18nKey="adminPriviliges">You need admin priviliges to see this page.</Trans>

  return (
    <>
      <section className="admin">
        <h2>{t('What do you want to do?')}</h2>
        <select className="radio" onChange={(event) => setSelection(event.target.value)}>
          <option id="add-user" value="add">
            {t('Add Account')}
          </option>
          <option id="change-password" value="password">
            {t('Reset Password')}
          </option>
          <option id="delete-user" value="delete">
            {t('Delete User')}
          </option>
        </select>
        <hr />
        {renderSelection()}
      </section>
    </>
  )
}

export default Admin
