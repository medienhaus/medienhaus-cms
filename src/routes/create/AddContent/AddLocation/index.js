import React, { useMemo, useRef, useState } from 'react'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'
import Matrix from '../../../../Matrix'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
// assets
import locations from '../../../../assets/data/locations.json'

const AddLocation = ({ number, inviteCollaborators, projectSpace, handleOnBlockWasAddedSuccessfully, peertube, allocationEvent, locationDropdown, callback, disabled }) => {
  const [selectedLocation, setSelectedLocation] = useState('custom')
  const [room, setRoom] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedBlockType, setSelectedBlockType] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('locations')
  const center = {
    lat: 53.12554953986769,
    lng: 13.071531023061585
  }
  const [position, setPosition] = useState(center)
  console.log(allocationEvent)

  const handleSubmit = async () => {
    setLoading(true)
    let allocation
    if (allocationEvent) {
      const newLocations = allocationEvent.physical
      newLocations.push({
        app: process.env.REACT_APP_APP_NAME,
        lat: position.lat.toString(),
        lng: position.lng.toString(),
        info: room
      })
      allocation = {
        version: '1.0',
        physical: newLocations
      }
    } else {
      allocation = {
        version: '1.0',
        physical: [
          {
            app: process.env.REACT_APP_APP_NAME,
            lat: position.lat.toString(),
            lng: position.lng.toString(),
            info: room
          }
        ]
      }
    }
    matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.allocation', allocation)
    handleOnBlockWasAddedSuccessfully() // @TODO delay between menu collapsing and event reloading
    callback()

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
  console.log(selectedLocation)
  return (
    <>
      {peertube &&
        <div>
          <label htmlFor="content-select">{t('Live stream or audio/video conference?')}</label>
          <select name="content-select" value={selectedBlockType} id="content-select" onChange={(e) => setSelectedBlockType(e.target.value)}>
            <option value="">{t('NONE')}</option>
            <option value="livestream">{t('WITH live stream')}</option>
            <option value="bbb">{t('WITH audio/video conference')}</option>
          </select>
        </div>}

      {locationDropdown &&
        <div>
          <label htmlFor="location-select">{t('Location')}</label>
          <select name="location-select" value={selectedLocation} id="location-select" onChange={(e) => setSelectedLocation(e.target.value)}>
            <option value="">{t('-- select venue --')}</option>
            <option value="custom">{t('other venue, please enter below')}</option>
            {locations.map(location => <option value={location.coordinates} key={location.coordinates}>{location.name}</option>)}
          </select>
        </div>}
      <>
        <p>{t('Drag the marker to the desired location:')}</p>
        <div className="map">
          <MapContainer className="center" center={center} zoom={12} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker />
          </MapContainer>
        </div>
      </>
      <input type="text" placeholder={t('details (i.e. room number)')} onChange={(e) => setRoom(e.target.value)} />

      <div className="confirmation">
        <button className="cancel" onClick={() => { callback() }}>{t('CANCEL')}</button>
        <LoadingSpinnerButton
          disabled={loading || disabled}
          onClick={handleSubmit}
        >{t('SAVE')}
        </LoadingSpinnerButton>
      </div>

    </>
  )
}

export default AddLocation
