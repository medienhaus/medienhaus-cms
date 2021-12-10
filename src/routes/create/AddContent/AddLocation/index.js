import React, { useMemo, useRef, useState } from 'react'
import LoadingSpinnerButton from '../../../../components/LoadingSpinnerButton'
import Matrix from '../../../../Matrix'
import AddDate from '../../addDate'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
// assets
import locations from '../../../../assets/data/locations.json'
import createBlock from '../../matrix_create_room'
import BigBlueButtonEmbed from '../../components/bigBlueButtonEmbed'
import PeertubeEmbed from '../../components/peertubeEmbed'

const AddLocation = ({ number, inviteCollaborators, projectSpace, handleOnBlockWasAddedSuccessfully, peertube, time, locationDropdown, callback }) => {
  const [selectedLocation, setSelectedLocation] = useState('')
  const [timeDate, setTimeDate] = useState([])
  const [room, setRoom] = useState('')
  const [loading, setLoading] = useState(false)
  const [bbbLink, setBbbLink] = useState('')
  const [validBbbLink, setValidBbbLink] = useState(false)
  const [validStreamLink, setValidStreamLink] = useState(false)
  const [selectedBlockType, setSelectedBlockType] = useState('')
  const [livestream, setLivestream] = useState()
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('locations')
  const center = {
    lat: 52.49082495640345,
    lng: 13.3595672835078
  }
  const [position, setPosition] = useState(center)
  const handleSubmit = async () => {
    setLoading(true)
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
            version: '0.3',
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
      // first we create a new space for this event
      const event = await matrixClient.createRoom(opts('event', number.toString() + '_event'))
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
      inviteCollaborators(event.room_id)
      // only create a location room if a selection is specefied
      if (selectedLocation) {
        const location = selectedLocation === 'custom' ? position.lat + ', ' + position.lng : selectedLocation
        const locationRoom = await createBlock(undefined, 'location', number.toString(), event.room_id)
        await matrixClient.sendMessage(locationRoom, {
          msgtype: 'm.text',
          body: location + '-' + room
        })
        inviteCollaborators(locationRoom)
      }
      // we only create a date room if either time or date are specified
      if (timeDate.length > 0 && (timeDate[0] !== '' || timeDate[1] !== '')) {
        const dateRoom = await createBlock(undefined, 'date', number.toString(), event.room_id)
        await matrixClient.sendMessage(dateRoom, {
          msgtype: 'm.text',
          body: timeDate[1] + ' ' + timeDate[0]
        })
        inviteCollaborators(dateRoom)
      }
      // if a bbb link was specified we create a room for it
      if (bbbLink) {
        const bbbRoom = await createBlock(undefined, 'bbb', number.toString(), event.room_id)
        await matrixClient.sendMessage(bbbRoom, {
          body: bbbLink,
          msgtype: 'm.text'
        })
        inviteCollaborators(bbbRoom)
      }
      // if a livestream was specified we create a room for it
      if (livestream) {
        const streamRoom = await createBlock(undefined, 'livestream', number.toString(), event.room_id)
        await matrixClient.sendMessage(streamRoom, {
          body: livestream,
          msgtype: 'm.text'
        })
        inviteCollaborators(streamRoom)
      }
      handleOnBlockWasAddedSuccessfully() // @TODO delay between menu collapsing and event reloading
      callback()
    } catch (err) {
      console.log(err)
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
      {peertube &&
        <div>
          <label htmlFor="content-select">{t('Live stream or audio/video conference?')}</label>
          <select name="content-select" value={selectedBlockType} id="content-select" onChange={(e) => setSelectedBlockType(e.target.value)}>
            <option value="">{t('NONE')}</option>
            <option value="livestream">{t('WITH live stream')}</option>
            <option value="bbb">{t('WITH audio/video conference')}</option>
          </select>
        </div>}
      {selectedBlockType === 'bbb'
        ? <BigBlueButtonEmbed
            callback={(link) => {
              setBbbLink(link)
              setValidBbbLink(link.startsWith('https://meetings.udk-berlin.de/') && link.substr(33, 100).match(/^([a-zA-Z0-9]{3}-){3}([a-zA-Z0-9]{3}){1}$/gi))
            }} onBlockWasAddedSuccessfully={handleOnBlockWasAddedSuccessfully}
          />
        : selectedBlockType === 'livestream' &&
          <PeertubeEmbed
            type="livestream" onBlockWasAddedSuccessfully={handleOnBlockWasAddedSuccessfully} callback={(stream) => {
              setLivestream(stream)
              setValidStreamLink(stream.startsWith('https://stream.udk-berlin.de/videos/watch/'))
            }}
          />}
      <div>
        <label htmlFor="location-select">{t('Venue')}</label>
        <select name="location-select" value={selectedLocation} id="location-select" onChange={(e) => setSelectedLocation(e.target.value)}>
          <option value="">{t('-- select venue --')}</option>
          <option value="custom">{t('other venue, please enter below')}</option>
          {locations.map(location => <option value={location.coordinates} key={location.coordinates}>{location.name}</option>)}
        </select>
      </div>

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

      {time &&
        <AddDate
          saveButton={false}
          callback={(time, date) => setTimeDate([time, date])}
        />}
      <div className="confirmation">
        <button className="cancel" onClick={() => { callback() }}>{t('CANCEL')}</button>
        <LoadingSpinnerButton
          disabled={loading || (selectedBlockType === '' && !selectedLocation) || (selectedBlockType === 'bbb' && !validBbbLink) || (selectedBlockType === 'livestream' && !validStreamLink)}
          onClick={handleSubmit}
        >{t('SAVE')}
        </LoadingSpinnerButton>
      </div>

    </>
  )
}

export default AddLocation
