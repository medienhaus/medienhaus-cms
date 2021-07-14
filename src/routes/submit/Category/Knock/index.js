import React, { useState } from 'react'
import matrixcs from 'matrix-js-sdk'
import { useAuth } from '../../../../Auth'

const knockClient = matrixcs.createClient({
  baseUrl: process.env.REACT_APP_MATRIX_BASE_URL,
  accessToken: process.env.REACT_APP_KNOCK_BOT_TOKEN,
  userId: process.env.REACT_APP_KNOCK_BOT_ACCOUNT,
  useAuthorizationHeader: true
})

const Knock = ({ room, callback }) => {
  const [requested, setRequested] = useState(false)
  const auth = useAuth()
  const profile = auth.user

  const sendRequestMessage = async (e) => {
    e.preventDefault()

    try {
      const save = await knockClient.sendMessage(room.knock + localStorage.getItem('mx_home_server'), {
        body: profile.displayname + ' (' + localStorage.getItem('mx_user_id') + ') wants to join ' + room.name + '(' + room.space + localStorage.getItem('mx_home_server') + ')',
        format: 'org.matrix.custom.html',
        msgtype: 'm.text'
      })

      if ('event_id' in save) {
        setRequested('✓')
        setTimeout(() => {
          setRequested(false)
          // eslint-disable-next-line
          callback(false)
        }, 2000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <button onClick={e => sendRequestMessage(e)} style={requested ? { backgroundColor: 'green' } : {}}>{requested || 'REQUEST'}</button>
  )
}
export default Knock
