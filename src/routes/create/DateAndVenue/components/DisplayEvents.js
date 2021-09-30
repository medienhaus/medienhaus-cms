import React from 'react'
import FetchCms from '../../../../components/matrix_fetch_cms'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import locations from '../../../../assets/data/locations.json'
import { Loading } from '../../../../components/loading'
import { useTranslation } from 'react-i18next'
import DisplayBbb from '../../components/DisplayBbb'

const DisplayEvents = ({ event, i }) => {
  const { t } = useTranslation('date')
  let { cms, error, fetching } = FetchCms(event.room_id)
  cms = cms[0]

  if (fetching) return <Loading />
  if (error) return <p>{t('something went wrong.')}</p>
  if (event.name.includes('location')) {
    return (

      <div key={i}>
        {cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-')) !== '0.0, 0.0' &&
          <MapContainer className="center" center={[cms.body.substring(0, cms.body.indexOf(',')), cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-'))]} zoom={17} scrollWheelZoom={false} placeholder>
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[cms.body.substring(0, cms.body.indexOf(',')), cms.body.substring(cms.body.indexOf(',') + 1, cms.body.indexOf('-'))]}>
              <Popup>
                {locations.find(coord => coord.coordinates === cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1, cms.body.lastIndexOf('-')))?.name || // if the location is not in our location.json
                    cms.body.substring(cms.body.lastIndexOf('-') + 1).length > 0 // we check if the custom input field was filled in
                  ? cms.body.substring(cms.body.lastIndexOf('-') + 1) // if true, we display that text on the popup otherwise we show the lat and long coordinates
                  : cms.body.substring(0, cms.body.indexOf(',')) + ',' + cms.body.substring(cms.body.indexOf(',') + 1)}
              </Popup>
            </Marker>
          </MapContainer>}
        {cms.body.substring(cms.body.lastIndexOf('-') + 1).length > 0 && <input type="text" value={cms.body.substring(cms.body.lastIndexOf('-') + 1)} disabled />}
      </div>
    )
  } else if (event.name.includes('bbb')) {
    return <DisplayBbb cms={cms} key={i} />
  } else {
    return (
      <div className="center">
        {cms.body.split(' ')[0] && <input type="date" value={cms.body.split(' ')[0]} disabled required />}
        {cms.body.split(' ')[1] && <input type="time" value={cms.body.split(' ')[1]} disabled required />}
      </div>
    )
  }
}
export default DisplayEvents
