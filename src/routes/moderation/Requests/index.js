import React, { useState } from 'react'
import matrixcs from 'matrix-js-sdk';
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton';

const knockClient = matrixcs.createClient({
    baseUrl: process.env.REACT_APP_MATRIX_BASE_URL,
    accessToken: process.env.REACT_APP_KNOCK_BOT_TOKEN,
    userId: process.env.REACT_APP_KNOCK_BOT_ACCOUNT,
    useAuthorizationHeader: true
})

const Requests = ({ roomId, body, eventId }) => {
    const [allButtonsDisabled, setAllButtonsDisabled] = useState(false);

    const redact = async (eventId) => {
        setAllButtonsDisabled(true)
        try {
            await knockClient.redactEvent(roomId, eventId).then(console.log)
        } catch (err) {
            console.error(err)
            setAllButtonsDisabled(false)
        }
    }

    const invite = async () => {
        setAllButtonsDisabled(true)
        const project = body.substring(
            body.lastIndexOf("(") + 1,
            body.lastIndexOf(")")
        );
        const user = body.substring(
            body.indexOf("(") + 1,
            body.indexOf(")")
        );

        try {
            await knockClient.invite(project, user).then((res) => {
                console.log(res)
                // in case we need to change power level for users
                // knockClient.getRoom(projectSpace)
                // matrixClient.setPowerLevel(projectSpace, id[1], 100, room.currentState.getStateEvents('m.room.power_levels', ''))
            })
        } catch (err) {
            console.error(err)
            setAllButtonsDisabled(false)

        }

    }

    return (
        <div>
            <div>
                <p>{body}</p>
                <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={invite} >ACCEPT</LoadingSpinnerButton>
                <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={() => redact(eventId)} >REJECT</LoadingSpinnerButton>
                <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={() => redact(eventId)} >REPORT</LoadingSpinnerButton>
            </div>
        </div>
    )
}
export default Requests