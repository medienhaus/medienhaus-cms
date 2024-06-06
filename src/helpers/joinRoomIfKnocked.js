import Matrix from '../Matrix'

/**
 * This function checks if the previous membership state was 'knock' and if so, it attempts to join the room and alerts the user accordingly.
 * @async
 * @param {(string|Object)} roomOrSpaceId - The room ID or room object.
 * @param {Object} event - The state event of the room.
 * @returns {Promise<{room_id: string, message: string} | null>} A promise that resolves to an object with room_id and message properties if the membership conditions are met, and null otherwise.
 * @throws Will throw an error if the join room request fails.
 */
export const joinRoomIfKnock = async (roomOrSpaceId, event) => {
  if (!event) return null

  // get the room name
  const roomName = await Matrix.getMatrixClient().getStateEvent(roomOrSpaceId, 'm.room.name')
  console.log(roomName)
  // Get the current and previous membership status
  const membership = event?.content?.membership
  const prevMembership = event?.prev_content?.membership || event.unsigned?.prev_content?.membership
  // If the current membership is 'invite' and the previous membership was 'knock', join the room
  if (membership === 'invite' && prevMembership === 'knock') {
    try {
      await Matrix.matrixClient.joinRoom(roomOrSpaceId)
      return { room_id: roomOrSpaceId, message: `You have been added to the following context: ${roomName.name}` }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
