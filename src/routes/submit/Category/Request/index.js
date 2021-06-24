import React, { useState } from 'react'
import Matrix from '../../../../Matrix'
import { useAuth } from '../../../../Auth'

const Request = ({ roomId }) => {
    const [requested, setRequested] = useState(false);
    const auth = useAuth()
    const profile = auth.user
    const matrixClient = Matrix.getMatrixClient()

    const sendRequestMessage = async (e) => {
        e.preventDefault()
        try {
            const save = await matrixClient.sendMessage(roomId, {
                body: profile.displayname + ' (' + localStorage.getItem('mx_user_id') + ') wants to join this space',
                format: 'org.matrix.custom.html',
                msgtype: 'm.text',
            })
            if ('event_id' in save) {
                setRequested('✓')
                setTimeout(() => {
                    setRequested(false)
                }, 1000)
            }
        } catch (err) {
            console.error(err)
        }
    }
    return (
        <button onClick={e => sendRequestMessage(e)}>{requested || 'REQUEST'}</button>

    )
}
export default Request