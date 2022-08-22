import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Redirect, useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'
import { Loading } from '../../components/loading'
import Matrix from '../../Matrix'

const Login = () => {
  const { register, formState: { errors }, handleSubmit } = useForm()
  const [isLoading, setLoading] = useState(false)
  const [serverResponseErrorMessage, setServerResponseErrorMessage] = useState('')
  const history = useHistory()
  const location = useLocation()
  const { t } = useTranslation('login')
  const matrixClient = Matrix.getMatrixClient()

  const auth = useAuth()

  const { from } = location.state || { from: { pathname: '/' } }

  useEffect(() => {
    // If we are being forwarded to this page from a SSO login flow just try to sign in using the provided token
    let loginToken = location.search.match(/(\?|&)loginToken=([^&]*)/)
    if (!loginToken) return

    loginToken = decodeURIComponent(loginToken[2])
    auth.signinUsingToken(loginToken, () => {
      setLoading(false)
      history.replace(from)
    })
  })

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
      {((process.env.REACT_APP_MATRIX_SSO_LOGIN === 'true')
        ? (
          <button onClick={() => { window.location.replace(matrixClient.getSsoLoginUrl(document.baseURI)) }}>LOGIN WITH SAML</button>
          )
        : (
          <>
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
          </>
          )
      )}
      <ul>
        {process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_FORGOT_PASSWORD && (<li>
          <a href={process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_FORGOT_PASSWORD} rel="external nofollow noopener noreferrer" target="_blank">
            {t('Forgot your password?')}
          </a>
        </li>)}
        {process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_REGISTER_ACCOUNT && (<li>
          <a href={process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_REGISTER_ACCOUNT} rel="external nofollow noopener noreferrer" target="_blank">
            {t('Register new account?')}
          </a>
        </li>)}
        {process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_SUPPORT_MAILTO && (<li>
          <a href={process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_SUPPORT_MAILTO} rel="external nofollow noopener noreferrer" target="_blank">
            {t('Need support?')}
          </a>
        </li>)}
      </ul>
    </section>
  )
}

export default Login
