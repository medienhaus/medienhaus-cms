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
        <label htmlFor="date">Choose a date:</label>
        <input
          id="date"
          name="date"
          type="date"
          min="2021-10-29"
          max="2021-10-31"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="time">Choose a time:</label>
        <input
          id="time" name="time" type="time" value={time} onChange={(e) => {
            setTime(e.target.value)
          }}
        />
      </div>
      <LoadingSpinnerButton disabled={loading || (!date && !time)} loading={loading} onClick={handleSubmit}>SAVE</LoadingSpinnerButton>
    </>
  )
}

export default AddDate
