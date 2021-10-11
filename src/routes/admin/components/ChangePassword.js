import React, { useState } from 'react'
import { useForm } from 'react-hook-form' // https://github.com/react-hook-form/react-hook-form
import { Loading } from '../../../components/loading'
import { useTranslation, Trans } from 'react-i18next'

const ChangePassword = () => {
  const [response, setResponse] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const { handleSubmit } = useForm()
  const { t } = useTranslation('admin')

  const onSubmit = async () => {
    setSending(true)
    const body = {
      new_password: password,
      logout_devices: true
    }
    fetch(`${process.env.REACT_APP_MATRIX_BASE_URL}/_synapse/admin/v1/reset_password/@${name}:${localStorage.getItem('mx_home_server')}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('mx_access_token') },
      body: JSON.stringify(body)
    })
      .then(async res => {
        if (res.ok) {
          setName('')
          setPassword('')
          setResponse(<Trans t={t} i18nKey="passChange">Password for user {name} was successfully changed.</Trans>)
          setTimeout(() => {
            setResponse('')
          }, 2500)
        } else {
          const error = await res.json()
          setResponse('An error occured: ' + error.error)
        }
      })
      .then(setSending(false))
  }
  return (
    <>
      <h2>{t('Reset Password')}</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="name">{t('Username')}: </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password">{t('Password')}: </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button type="submit" disabled={sending || !name || !password}>{sending ? <Loading /> : t('SUBMIT')}</button>
      </form>
      {response && <p>{response}</p>}
    </>
  )
}
export default ChangePassword
