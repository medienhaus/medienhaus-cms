import React, { useState } from 'react'
import Matrix from '../../Matrix'
import Requests from './Requests'
import { Loading } from '../../components/loading'
import joinedRooms from '../../components/matrix_joined_rooms'
import useFetchCms from '../../components/matrix_fetch_cms'

const Moderation = () => {
    const matrixClient = Matrix.getMatrixClient()
    const [loading, setLoading] = useState(false);
    const [space, setSpace] = useState('');
    const [member, setMember] = useState(false);
    const moderationRooms = joinedRooms().filter(obj =>
        Object.keys(obj)
            .some(key => obj[key].includes('door')))

    const GetRequestPerRoom = ({ roomId }) => {
        let { cms, error, fetching } = useFetchCms(roomId);

        if (fetching) {
            return <Loading />
        }
        if (error) {
            console.error(error);
            return;
        }

        return cms.map(knock => {
            return <Requests roomId={roomId} body={knock.body} eventId={knock.event_id} />
        })
    }

    return (
        <div>
            {moderationRooms.length > 0 && moderationRooms.map(requests => <GetRequestPerRoom roomId={requests.room_id} />)}
        </div>
    )
}
export default Moderation