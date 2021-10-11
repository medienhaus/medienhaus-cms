import React, { useState } from 'react'
import { useForm } from 'react-hook-form' // https://github.com/react-hook-form/react-hook-form
import { useTranslation } from 'react-i18next'
import { Loading } from '../../../components/loading'

const DeleteUser = () => {
  const [response, setResponse] = useState('')
  const [name, setName] = useState('')
  const [sending, setSending] = useState(false)
  const { handleSubmit } = useForm()
  const { t } = useTranslation('admin')

  const onSubmit = async () => {
    setSending(true)
    const body = {
      erase: true
    }
    fetch(`${process.env.REACT_APP_MATRIX_BASE_URL}/_synapse/admin/v1/deactivate/@${name}:${localStorage.getItem('mx_home_server')}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('mx_access_token') },
      body: JSON.stringify(body)
    })
      .then(async res => {
        if (res.ok) {
          setName('')
          setResponse(t('Successfully deleted user ') + name)
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
      <h2>Delete user</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="name">{t('Username')}: </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <button type="submit" disabled={sending || !name}>{sending ? <Loading /> : t('SUBMIT')}</button>
      </form>
      {response && <p>{response}</p>}
    </>
  )
}
export default DeleteUser
