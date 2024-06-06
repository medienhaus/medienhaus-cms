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

  // Check if roomOrSpaceId is a string, if so, it's a spaceId and we need to get the room
  const room = typeof roomOrSpaceId === 'string' ? await Matrix.matrixClient.getRoom(roomOrSpaceId) : roomOrSpaceId
  // Get the current and previous membership status
  const membership = event?.content?.membership
  const prevMembership = event?.prev_content?.membership || event.unsigned?.prev_content?.membership
  // If the current membership is 'invite' and the previous membership was 'knock', join the room
  if (membership === 'invite' && prevMembership === 'knock') {
    try {
      await Matrix.matrixClient.joinRoom(roomOrSpaceId)
      return { room_id: roomOrSpaceId, message: `You have been added to the following context: ${room.name}` }
    } catch (error) {
      console.error(`Failed to join room: ${error}`)
      throw error
    }
  }
  // otherwise, return null
  return null
}
