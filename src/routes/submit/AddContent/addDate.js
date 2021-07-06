import React, { useState } from 'react'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import Matrix from '../../../Matrix'

const AddDate = ({ onCreateRoomForBlock, onBlockWasAddedSuccessfully }) => {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  console.log(date, time)
  const handleSubmit = async () => {
    setLoading(true)
    await onCreateRoomForBlock().then(async (res) =>
      await matrixClient.sendMessage(res, {
        msgtype: 'm.text',
        body: date + ' ' + time
      })).catch(console.log)
    onBlockWasAddedSuccessfully()
    setLoading(false)
  }

  return (
    <>
      <div>
        <label htmlFor="party">Choose a date:</label>
        <input id="party" name="party" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label htmlFor="appt">Choose a time:</label>
        <input id="appt" name="appt" type="time" value={time} onChange={(e) => {
          console.log(e)
          setTime(e.target.value)
        }} />
      </div>
      <LoadingSpinnerButton loading={loading} onClick={handleSubmit}>SAVE</LoadingSpinnerButton>
    </>
  )
}

export default AddDate