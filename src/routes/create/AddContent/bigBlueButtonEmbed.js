import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const BigBlueButtonEmbed = ({ onCreateRoomForBlock, onBlockWasAddedSuccessfully }) => {
  const [inputValue, setInputValue] = useState('')
  const matrixClient = Matrix.getMatrixClient()

  async function handleSubmit () {
    const blockRoomId = await onCreateRoomForBlock()
    await matrixClient.sendMessage(blockRoomId, {
      body: inputValue,
      msgtype: 'm.text'
    })
    onBlockWasAddedSuccessfully()
  }

  function onChangeInputValue (e) {
    setInputValue(e.target.value)
  }

  // Validation if this is a real BigBlueButton link
  // Example: https://meetings.udk-berlin.de/b/and-rkf-d0i-8xk
  const validInputValue = inputValue.startsWith('https://meetings.udk-berlin.de/') && inputValue.substr(33, 100).match(/^([a-zA-Z0-9]{3}-){3}([a-zA-Z0-9]{3}){1}$/gi)

  return (
    <div>
      <input type="text" value={inputValue} onChange={onChangeInputValue} placeholder="https://meetings.udk-berlin.de/b/bbb-foo-bar-baz" />
      <LoadingSpinnerButton onClick={handleSubmit} disabled={!inputValue || !validInputValue}>Add Content</LoadingSpinnerButton>
    </div>
  )
}

export default BigBlueButtonEmbed
