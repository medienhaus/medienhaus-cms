import React, { useState } from 'react'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'
import Matrix from '../../../../Matrix'
// assets
import locations from '../../../../assets/data/locations.json'

const AddLocation = ({ onCreateRoomForBlock, onBlockWasAddedSuccessfully }) => {
  const [selectedLocation, setSelectedLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()
  console.log(selectedLocation)

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
        <option value="" disabled={true} >------ SELECT LOCATION ------</option>
                {locations.map(location => <option value={location.coordinates} key={location.coordinates}>{location.name}</option>)}
            </select>
            <LoadingSpinnerButton disabled={ loading || !selectedLocation} onClick={handleSubmit}>SAVE</LoadingSpinnerButton>
        </>
  )
}
export default AddLocation
