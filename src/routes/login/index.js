
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Redirect, useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'
import { Loading } from '../../components/loading'

const Login = () => {
  const {
    // register,
    handleSubmit,

    formState: {
      errors
    }
  } = useForm()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setLoading] = useState(false)
  const [errormsg, setErrormsg] = useState()
  const history = useHistory()
  const location = useLocation()
  const { t } = useTranslation('login')

  const auth = useAuth()

  const { from } = location.state || { from: { pathname: '/dashboard' } }

  const onSubmit = () => {
    if (isLoading) { return }
    setLoading(true)
    setErrormsg()
    auth.signin(name, password, () => {
      setLoading(false)
      history.replace(from)
    }).catch((error) => {
      setErrormsg(error.data.error)
      setLoading(false)
    })
  }

  const changeName = e => setName(e.target.value)
  const changePassword = e => { setPassword(e.target.value); setErrormsg() }

  if (auth.user) {
    return <Redirect to={'/dashboard'} />
  }

  return (
    <section id="login">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="username">{t('username')}:</label>
          <input name="username" type="text" placeholder={t('u.name')} value={name} onChange={changeName} /> {// {...register('username', { required: true })} />
            // new version of react hook form kills typing if required, need to check whats going on
          }

        </div>
        {errors.username && t('Username can\'t be empty.')}
        <div>
          <label htmlFor="password">{t('password')}:</label>
          <input name="password" type="password" placeholder="" value={password} onChange={changePassword} /> {// {...register('password',{ required: true })} />
          }
        </div>
        {errors.password && t('Password can\'t be empty.')}
        {errormsg ?? errormsg}
        {isLoading
          ? (
            <Loading />
          )
          : (
            <button name="submit" type="submit">LOGIN</button>
          )}
      </form>
      <ul>
        <li>
          <a href={process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_FORGOT_PASSWORD} rel="external noopener noreferrer">
            {t('Forgot your password?')}
          </a>
        </li>
        <li>
          <a href={process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_REGISTER_ACCOUNT} rel="external noopener noreferrer">
            {t('Register new account?')}
          </a>
        </li>
        <li>
          <a href={process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_SUPPORT_MAILTO} rel="external noopener noreferrer">
            {t('Need support?')}
          </a>
        </li>
      </ul>
    </section>
  )
}

export default Login
