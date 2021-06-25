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
    //let { cms, error, fetching } = useFetchCms();
    console.log(moderationRooms);

    const isMember = async (e) => {
        e.preventDefault()
        setLoading(true)
        setSpace(e.target.value)
        try {
            await matrixClient.members(space + localStorage.getItem('mx_home_server')).catch(err => console.error(err)).then(res => {
                setMember(res.chunk.map(a => a.sender).includes(localStorage.getItem('mx_user_id')))
            })
            console.log(member);
        } catch (err) {
            console.error(err)
            setMember(false)
        }
        setLoading(false)
    }

    return (
        <div>
            <label htmlFor="subject">Please select a space to moderate</label>
            <select id="subject" name="subject" defaultValue={''} value={space} onChange={(e) => isMember(e)}>
                <option value="" disabled={true} >Select Context</option>
                <option value="!JaLRUAZnONCuUHMPvy:" >New Media</option>
                <option value="!rorMnDkmfIThdFzwPD:" >Digitale Klasse</option>
            </select>
            {loading && <Loading />}
            {member ? <Requests roomId={space + localStorage.getItem('mx_home_server')} body={null} eventId={null} /> : space === ''? null : '  nö'}
        </div>
    )
}
export default Moderation