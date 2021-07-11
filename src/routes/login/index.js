import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Redirect, useHistory, useLocation } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../../Auth'

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

  const { from } = location.state || { from: { pathname: '/projects' } }

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
    return <Redirect to={'/projects'} />
  }

  return (
    <section id="login">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="username">{t('username')}</label>
          <div>
            <input name="username" type="text" placeholder={t('u.name')} value={name} onChange={changeName} /> {// @TODO {...register('username', { required: true })} />
            <select defaultValue="udk">
              <option value="udk">@udk-berlin.de</option>
              <option value="intra">@intra.udk-berlin.de</option>
            </select>
          }
          </div>
        </div>
        {errors.username && t('Username can\'t be empty.')}
        <div>
          <label htmlFor="password">{t('password')}</label>
          <input name="password" type="password" placeholder="••••••••••••••••••••••••" value={password} onChange={changePassword} /> {// @TODO {...register('password',{ required: true })} />
          }
        </div>
        {errors?.password && t('Password can\'t be empty.')}
        {errormsg ?? errormsg}
            <button name="submit" type="submit" >LOGIN</button>
      </form>
      <p>
        <Trans t={t} i18nKey="usernameSameAsEmail">
          Your login <code>username</code> and <code>password</code> are the same as for your <code>@udk-berlin.de</code> or <code>@intra.udk-berlin.de</code> mail account. If you forgot your password or want to change it, please check the links below.
        </Trans>
      </p>
      <ul>
        <li>
          <a href={process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_FORGOT_PASSWORD} rel="external nofollow noopener noreferrer">
            {t('Forgot your password?')}
          </a>
        </li>
        <li>
          <a href={process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_REGISTER_ACCOUNT} rel="external nofollow noopener noreferrer">
            {t('Register new account?')}
          </a>
        </li>
        <li>
          <a href={process.env.REACT_APP_MEDIENHAUS_FRONTEND_LOGIN_SUPPORT_MAILTO} rel="external nofollow noopener noreferrer">
            {t('Need support?')}
          </a>
        </li>
      </ul>
    </section>
  )
}

export default Login
