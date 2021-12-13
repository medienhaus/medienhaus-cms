import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Redirect, useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'
import { Loading } from '../../components/loading'

const Login = () => {
  const { register, formState: { errors }, handleSubmit } = useForm()
  const [isLoading, setLoading] = useState(false)
  const [serverResponseErrorMessage, setServerResponseErrorMessage] = useState('')
  const history = useHistory()
  const location = useLocation()
  const { t } = useTranslation('login')

  const auth = useAuth()

  const { from } = location.state || { from: { pathname: '/' } }

  const onSubmit = data => {
    if (isLoading) { return }
    setLoading(true)
    setServerResponseErrorMessage('')
    auth.signin(data.username, data.password, () => {
      setLoading(false)
      history.replace(from)
    }).catch((error) => {
      setServerResponseErrorMessage(error?.data?.error || t('Sorry, something went wrong. Please try again later.'))
      setLoading(false)
    })
  }

  if (auth.user) {
    return <Redirect to="/" />
  }

  return (
    <section className="login">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="username">{t('username')}</label>
          <input {...register('username', { required: true })} name="username" type="text" placeholder={t('u.name')} />
        </div>
        {errors?.username && t('Username can\'t be empty.')}
        <div>
          <label htmlFor="password">{t('password')}</label>
          <input {...register('password', { required: true })} name="password" type="password" placeholder="••••••••••••••••••••••••" />
        </div>
        {errors?.password && t('Password can\'t be empty.')}
        {serverResponseErrorMessage && <p>❗️ {serverResponseErrorMessage}</p>}
        <button name="submit" type="submit" disabled={isLoading}>{isLoading ? <Loading /> : 'LOGIN'}</button>
      </form>
      <ul>
        <li>
          <a href="https://stechlin-institut.ruralmindshift.org/chat/#/forgot_password" rel="external nofollow noopener noreferrer">
            {t('Forgot your password?')}
          </a>
        </li>
      </ul>
    </section>
  )
}

export default Login
