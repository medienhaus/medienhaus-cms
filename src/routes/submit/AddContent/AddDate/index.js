import React, { useState } from 'react'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'
import Matrix from '../../../../Matrix'
// assets
import locations from '../../../../assets/locations.json'

const AddDate = ({ onCreateRoomForBlock, onBlockWasAddedSuccessfully }) => {
  const [selectedLocation, setSelectedLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  const handleSubmit = async () => {
    setLoading(true)
    await onCreateRoomForBlock().then(async (res) =>
      await matrixClient.sendMessage(res, {
        msgtype: 'm.text',
        body: selectedLocation
      })).catch(console.log)
    onBlockWasAddedSuccessfully()
    setLoading(false)
  }

  return (
        <>
            <select name="location-select" value={selectedLocation} id="location-select" onChange={(e) => setSelectedLocation(e.target.value)}>
                {locations.map(location => <option value={location.coordinates} key={location.coordinates}>{location.name}</option>)}
            </select>
            <LoadingSpinnerButton loading={ loading} onClick={handleSubmit}>SAVE</LoadingSpinnerButton>
        </>
  )
}
export default AddDate
