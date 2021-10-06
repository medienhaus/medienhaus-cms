import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const BigBlueButtonEmbed = ({ onCreateRoomForBlock, onBlockWasAddedSuccessfully, saveButton, callback }) => {
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

  // Validation if this is a real BigBlueButton link
  // Example: https://meetings.udk-berlin.de/b/and-rkf-d0i-8xk
  const validInputValue = inputValue.startsWith('https://meetings.udk-berlin.de/') && inputValue.substr(33, 100).match(/^([a-zA-Z0-9]{3}-){3}([a-zA-Z0-9]{3}){1}$/gi)

  function onChangeInputValue (e) {
    setInputValue(e.target.value)
    !saveButton && callback(e.target.value)
  }

  return (
    <div>
      <input type="text" value={inputValue} onChange={onChangeInputValue} placeholder="https://meetings.udk-berlin.de/b/bbb-foo-bar-baz" />
      {saveButton && <LoadingSpinnerButton onClick={handleSubmit} disabled={!inputValue || !validInputValue}>Add Content</LoadingSpinnerButton>}
    </div>
  )
}

export default BigBlueButtonEmbed
