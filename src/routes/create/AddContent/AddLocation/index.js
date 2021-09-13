import React, { useState } from 'react'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'
import Matrix from '../../../../Matrix'
import { useTranslation } from 'react-i18next'
// assets
import locations from '../../../../assets/data/locations.json'
import createBlock from '../../matrix_create_room'

const AddLocation = ({ number, projectSpace, onBlockWasAddedSuccessfully, callback }) => {
  const [selectedLocation, setSelectedLocation] = useState('')
  const [room, setRoom] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('locations')
  console.log(selectedLocation)

  const handleSubmit = async () => {
    setLoading(true)
    await createBlock(undefined, 'location', number, projectSpace).then(async (res) =>
      await matrixClient.sendMessage(res, {
        msgtype: 'm.text',
        body: selectedLocation + '-' + room
      })).catch(console.log)
    callback()
    onBlockWasAddedSuccessfully()
    setLoading(false)
  }

  return (
    <>
      <select name="location-select" value={selectedLocation} id="location-select" onChange={(e) => setSelectedLocation(e.target.value)}>
        <option value="" disabled>{t('-- select venue --')}</option>
        <option value="0.0, 0.0">{t('other venue, please enter below')}</option>
        {locations.map(location => <option value={location.coordinates} key={location.coordinates}>{location.name}</option>)}
      </select>
      <input type="text" placeholder={t('room number or specific location')} onChange={(e) => setRoom(e.target.value)} />
      <div className="confirmation">
        <LoadingSpinnerButton disabled={loading || !selectedLocation || (selectedLocation === '0.0, 0.0' && !room)} onClick={handleSubmit}>{t('SAVE')}</LoadingSpinnerButton>
        <button className="cancel" onClick={() => { callback() }}>{t('CANCEL')}</button>
      </div>
    </>
  )
}

export default AddLocation
