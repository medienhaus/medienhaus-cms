import Matrix from '../Matrix'
import { joinRoomIfKnock } from './joinRoomIfKnocked'

// Function to handle 'RoomMember.membership' events
export const handleMembershipEvent = async (event, member) => {
  // only listen to events for the current user
  if (member.userId !== Matrix.getMatrixClient().getUserId()) return
  const autoJoinRoom = await joinRoomIfKnock(event.event.room_id, event.event)
    .catch(error => {
      console.log(error)
      alert(`The following error occurred: ${error.data?.error}`)
    })
  // if a room was joined, and the user therefore has access to the room, we alert the user
  if (autoJoinRoom) alert(autoJoinRoom.message)
}
