import React, { useMemo, useRef, useState } from 'react'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'
import Matrix from '../../../../Matrix'
import AddDate from '../../addDate'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
// assets
import locations from '../../../../assets/data/locations.json'
import createBlock from '../../matrix_create_room'

const AddLocation = ({ number, projectSpace, onBlockWasAddedSuccessfully, callback }) => {
  const [selectedLocation, setSelectedLocation] = useState('')
  const [timeDate, setTimeDate] = useState([])
  const [room, setRoom] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('locations')
  const center = {
    lat: 52.49082495640345,
    lng: 13.3595672835078
  }
  const [position, setPosition] = useState(center)

  const handleSubmit = async () => {
    setLoading(true)
    // first we create a new space for this event
    const opts = (type, name) => {
      return {
        preset: 'private_chat',
        name: name,
        room_version: '7',
        creation_content: { type: 'm.space' },
        initial_state: [{
          type: 'm.room.history_visibility',
          content: { history_visibility: 'world_readable' }
        },
        {
          type: 'dev.medienhaus.meta',
          content: {
            version: '0.2',
            rundgang: 21,
            type: type
          }
        },
        {
          type: 'm.room.guest_access',
          state_key: '',
          content: { guest_access: 'can_join' }
        }],
        visibility: 'private'
      }
    }
    try {
      console.log(number)
      const event = await matrixClient.createRoom(opts('event', number.toString()))
      // and add those subspaces as children to the project space
      await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.space.child/${event.room_id}`, {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
        body: JSON.stringify({
          via:
                  [process.env.REACT_APP_MATRIX_BASE_URL],
          suggested: false,
          auto_join: true
        })
      })
      const location = selectedLocation === 'custom' ? position.lat + ', ' + position.lng : selectedLocation
      const locationRoom = await createBlock(undefined, 'location', number.toString(), event.room_id)
      await matrixClient.sendMessage(locationRoom, {
        msgtype: 'm.text',
        body: location + '-' + room
      })
      // we only create a date room if either time or date are specified
      if (timeDate.length > 0 && (timeDate[0] !== '' || timeDate[1] !== '')) {
        const dateRoom = await createBlock(undefined, 'date', number.toString(), event.room_id)
        await matrixClient.sendMessage(dateRoom, {
          msgtype: 'm.text',
          body: timeDate[1] + ' ' + timeDate[0]
        })
      }
      callback()
      onBlockWasAddedSuccessfully()
    } catch (err) {

    }

    setLoading(false)
  }

  function DraggableMarker () {
    const markerRef = useRef(null)
    const map = useMap()
    map.on('focus', function () { map.scrollWheelZoom.enable() })
    map.on('blur', function () { map.scrollWheelZoom.disable() })

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
      <AddDate
        saveButton={false}
        callback={(time, date) => setTimeDate([time, date])}
      />
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
