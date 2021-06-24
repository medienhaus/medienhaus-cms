import React, { useState } from 'react'
import useFetchCms from '../../../components/matrix_fetch_cms'
import RejectButton from './RejectButton';
import { Loading } from '../../../components/loading';

const Requests = ({ roomId }) => {
    const { cms, error, fetching } = useFetchCms(roomId);

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

    return (
        <div>
            {fetching ? <Loading /> : cms?.map(request => {
                return (
                    <div>
                        <p>{request.body}</p>
                        <AcceptButton />
                        <RejectButton eventId={request.eventId} roomId={roomId} />
                        <ReportButton />
                    </div>)
            })}
        </div>
    )
}
export default Requests