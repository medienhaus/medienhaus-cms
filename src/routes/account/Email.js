import React, { useEffect, useRef, useState } from 'react'

import InputField from '../../components/medienhausUI/inputField'
import SimpleButton from '../../components/medienhausUI/simpleButton'
import Matrix from '../../Matrix'

export const Email = (props) => {
  const [input, setInput] = useState('')
  const [emails, setEmails] = useState()
  const [password, setPassword] = useState()
  const [tokenObject, setTokenObject] = useState()
  const [requested, setRequested] = useState(false)
  const sendAttempt = useRef(0)
  const [sid, setSid] = useState(window.location.href.split('sid=').pop())
  const [secret, setSecret] = useState(window.location.href.split('secret=').pop().split('&')[0])
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    console.log(sid)
    console.log(secret)
    if (sid !== window.location.href) {
      props.callback(true)

      const obj = {
        sid: sid,
        client_secret: secret,
        auth: {
          type: 'm.login.password',
          user: localStorage.getItem('mx_user_id'),
          identifier: {
            type: 'm.id.user',
            user: localStorage.getItem('mx_user_id')
          },
          password: password
        }
      }
      setTokenObject(obj)
    }
  }, [props, sid])

  function isEmail (val) {
    const regEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!regEmail.test(val)) {
      return true
    }
  }

  const getEmails = async () => {
    const threePids = await matrixClient.getThreePids()
    setEmails(threePids.threepids)
    console.log(threePids.threepids)
  }

  const requestEmail = async () => {
    const secret = await matrixClient.generateClientSecret()
    sendAttempt.current = sendAttempt.current + 1

    const requestToken = await matrixClient.requestAdd3pidEmailToken(input, secret, sendAttempt.current, `http://localhost:3000/account?=secret=${secret}`).catch(console.log)
    requestToken.sid && setRequested(true)
  }

  const addEmail = async () => {
    console.log(tokenObject)
    const addEmailToMatrix = await matrixClient.addThreePidOnly(tokenObject).catch((error) => console.log(error))
    console.log(addEmailToMatrix)
    if (addEmailToMatrix) {
      getEmails()
      setPassword('')
      setInput('')
      setTokenObject()
      setSid('')
      setSecret('')
      props.callback(false)
    }
  }

  const changeMail = (mail) => setInput(mail)
  const changePassword = (pw) => setPassword(pw)
  // eslint-disable-next-line
  useEffect(() => getEmails(), [])

  return (
    <div>
      <h3>{sid[1] ? 'Please verify your email' : 'Email addresses'}</h3>
      {emails && emails.map((email, index) => {
        return <p key={email.address + index}>{email.address}</p>
      })}
      {sid === window.location.href && <InputField name="email" label="add new email address" onChange={(e) => changeMail(e.target.value)} />}
      {sid === window.location.href && <SimpleButton disabled={isEmail(input)} onClick={requestEmail}>{requested ? 'RESEND MAIL' : 'ADD'}</SimpleButton>}
      {requested && <p>We've sent a link to your email!</p>}
      {sid !== window.location.href && <InputField name="email" type="password" label="password" onChange={(e) => changePassword(e.target.value)} />}
      {sid !== window.location.href && <SimpleButton disabled={!window.location.href.substring(window.location.href.indexOf('sid=') + 4)} onClick={addEmail}>VERIFY MAIL</SimpleButton>}
    </div>
  )
}
