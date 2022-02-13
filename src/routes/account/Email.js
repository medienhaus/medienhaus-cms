import React, { useEffect, useRef, useState } from 'react'
import InputField from '../../components/medienhausUI/inputField'
import SimpleButton from '../../components/medienhausUI/simpleButton'
import Matrix from '../../Matrix'

export const Email = () => {
  const [input, setInput] = useState('')
  const [emails, setEmails] = useState()
  const [password, setPassword] = useState()
  const [tokenObject, setTokenObject] = useState()
  const sendAttempt = useRef(0)
  const matrixClient = Matrix.getMatrixClient()

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

    const requestToken = await matrixClient.requestAdd3pidEmailToken(input, secret, sendAttempt.current, 'http://localhost:3000/account').catch(console.log)
    console.log(requestToken)

    const obj = {
      sid: requestToken.sid,
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

  const addEmail = async () => {
    console.log(tokenObject)
    const addEmailToMatrix = await matrixClient.addThreePidOnly(tokenObject)
    console.log(addEmailToMatrix)
    getEmails()
    setPassword('')
    setInput('')
    setTokenObject()
  }

  const changeMail = (mail) => setInput(mail)
  const changePassword = (pw) => setPassword(pw)

  // eslint-disable-next-line
  useEffect(() => getEmails(), [])

  return (
    <div>
      <h3>Email addresses</h3>
      {emails && emails.map((email, index) => {
        return <p key={email.address + index}>{email.address}</p>
      })}
      <InputField name="email" type="password" label="password" onChange={(e) => changePassword(e.target.value)} />
      <InputField name="email" label="add new email address" onChange={(e) => changeMail(e.target.value)} />
      <SimpleButton disabled={isEmail(input)} onClick={requestEmail}>ADD</SimpleButton>
      <SimpleButton disabled={!tokenObject} onClick={addEmail}>VERIFIED MAIL</SimpleButton>
    </div>
  )
}
