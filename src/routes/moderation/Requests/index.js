import React, { useEffect, useState } from 'react'
import matrixcs from "matrix-js-sdk";
import useFetchCms from '../../../components/matrix_fetch_cms'
import LoadingSpinnerButton from './LoadingSpinnerButton';
import { Loading } from '../../../components/loading';

const knockClient = matrixcs.createClient({
    baseUrl: process.env.REACT_APP_MATRIX_BASE_URL,
    accessToken: process.env.REACT_APP_KNOCK_BOT_TOKEN,
    userId: process.env.REACT_APP_KNOCK_BOT_ACCOUNT,
    useAuthorizationHeader: true
})

const Requests = ({ roomId }) => {
    let { cms, error, fetching } = useFetchCms(roomId);
    const [deleteIndex, setDeleteIndex] = useState();
    const [allButtonsDisabled, setAllButtonsDisabled] = useState(false);


    useEffect(() => {
    cms = cms.splice(deleteIndex, 1)
    }, [deleteIndex]);

    const handleButtons = (index) => {
        setDeleteIndex(index)
    }

    const AcceptButton = () => {
        const [inviting, setInviting] = useState(false);
        const [accepted, setAccepted] = useState(false);

        const invite = async (e) => {
            /*
                        setInviting(true)
                        e.preventDefault()
            
                        try {
                            await knockClient.invite(projectSpace, user).then(() => {
                                //const room = matrixClient.getRoom(projectSpace)
                                //matrixClient.setPowerLevel(projectSpace, id[1], 100, room.currentState.getStateEvents('m.room.power_levels', ''))
                            })
                            setAccepted(true)
                            console.log('done')
                        } catch (err) {
                            console.error(err)
                        } finally {
                            setInviting(false)
                        }
            */
        }
        return <button onClick={e => invite(e)} >ACCEPT</button>
    }


    const ReportButton = () => {
        return <button>REPORT</button>

    }

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
            {fetching ? <Loading /> : cms?.map((request, index) => {
                return (
                    <div>
                        <p>{request.body}</p>
                        <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={() => redact(request.eventId)} >ACCEPT</LoadingSpinnerButton>
                        <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={() => redact(request.eventId)} >REJECT</LoadingSpinnerButton>
                        <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={() => redact(request.eventId)} >REPORT</LoadingSpinnerButton>
                        

                    </div>)
            })}
        </div>
    )
}
export default Requests