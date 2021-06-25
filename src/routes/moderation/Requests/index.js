import React, { useEffect, useState } from 'react'
import matrixcs from "matrix-js-sdk";
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton';

const knockClient = matrixcs.createClient({
    baseUrl: process.env.REACT_APP_MATRIX_BASE_URL,
    accessToken: process.env.REACT_APP_KNOCK_BOT_TOKEN,
    userId: process.env.REACT_APP_KNOCK_BOT_ACCOUNT,
    useAuthorizationHeader: true
})

const Requests = ({ roomId, body, eventId}) => {
    const [deleteIndex, setDeleteIndex] = useState();
    const [allButtonsDisabled, setAllButtonsDisabled] = useState(false);
    
    const redact = async (eventId) => {
        setAllButtonsDisabled(true)
        try {
           await knockClient.redactEvent(roomId, eventId).then(console.log)
        } catch (err) {
            console.error(err)
            setAllButtonsDisabled(false)
        } finally {
        }
    }

    return (
        <div>
                return (
                    <div>
                        <p>{body}</p>
                        <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={() => redact(eventId)} >ACCEPT</LoadingSpinnerButton>
                        <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={() => redact(eventId)} >REJECT</LoadingSpinnerButton>
                        <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={() => redact(eventId)} >REPORT</LoadingSpinnerButton>
                    </div>  
        </div>
    )
}
export default Requests