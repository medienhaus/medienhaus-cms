import React, { useMemo, useRef, useState } from 'react'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'
import Matrix from '../../../../Matrix'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
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
  const center = {
    lat: 52.49082495640345,
    lng: 13.3595672835078
  }
  const [position, setPosition] = useState(center)

  const dev = false

  const handleSubmit = async () => {
    setLoading(true)
    const location = selectedLocation === 'custom' ? position.lat + ', ' + position.lng : selectedLocation
    if (dev) {
      console.log(location)
    } else {
      await createBlock(undefined, 'location', number, projectSpace).then(async (res) =>
        await matrixClient.sendMessage(res, {
          msgtype: 'm.text',
          body: location + '-' + room
        })).catch(console.log)
      callback()
      onBlockWasAddedSuccessfully()
    }
    setLoading(false)
  }

  function DraggableMarker () {
    const markerRef = useRef(null)

    const eventHandlers = useMemo(
      () => ({
        dragend () {
          const marker = markerRef.current
          if (marker != null) {
            setPosition(marker.getLatLng())
          }
        }
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    )

    return (
      <Marker
        draggable
        eventHandlers={eventHandlers}
        position={position}
        ref={markerRef}
      >
        <Popup minWidth={90}>
          <span>
            lat: {position.lat}, lng: {position.lng}
          </span>
        </Popup>
      </Marker>
    )
  }

  return (
    <>
      <select name="location-select" value={selectedLocation} id="location-select" onChange={(e) => setSelectedLocation(e.target.value)}>
        <option value="" disabled>{t('-- select venue --')}</option>
        <option value="custom">{t('other venue, please enter below')}</option>
        {locations.map(location => <option value={location.coordinates} key={location.coordinates}>{location.name}</option>)}
      </select>

      {selectedLocation === 'custom' && <>
        <p>{t('Drag the marker to the desired location.')}</p>
        <div className="map">
          <MapContainer className="center" center={center} zoom={12} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker />
          </MapContainer>
        </div>
      </>}
      <input type="text" placeholder={t('room number or specific location')} onChange={(e) => setRoom(e.target.value)} />

      <div className="confirmation">
        <button className="cancel" onClick={() => { callback() }}>{t('CANCEL')}</button>
        <LoadingSpinnerButton disabled={loading || !selectedLocation || (selectedLocation === '0.0, 0.0' && !room)} onClick={handleSubmit}>{t('SAVE')}</LoadingSpinnerButton>
      </div>
    </>
  )
}

export default AddLocation
