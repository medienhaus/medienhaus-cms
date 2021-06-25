import React, {useEffect, useState} from 'react'
import Matrix from '../../../Matrix'
import createBlock from '../matrix_create_room'

const PeertubeEmbed = ({type, onCreateRoomForBlock, onBlockWasAddedSuccessfully}) => {
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState({});
  const [selectedEntry, setSelectedEntry] = useState('');
  const matrixClient = Matrix.getMatrixClient()

  useEffect( () => {
    async function fetchEntries() {
      setLoading(true);
      const resourceType = (type === 'playlist' ? 'video-playlists' : 'videos')
      // TODO:
      // const request = await fetch(`https://stream.udk-berlin.de/api/v1/accounts/${matrixClient.getUserIdLocalpart()}/${resourceType}`)

      // TODO:
      // if type === live then modify to only show live stream videos, not all videos
      // TODO:
      // pagination
      const request = await fetch(`https://stream.udk-berlin.de/api/v1/accounts/e.dietrich/${resourceType}`)
      const entries = await request.json()
      setEntries(entries.data)
      setLoading(false);
    }
    fetchEntries()
  }, [type])

  async function handleSubmit() {
    const blockRoomId = await onCreateRoomForBlock()
    const sendMessageResult = await matrixClient.sendMessage(blockRoomId, {
      body: selectedEntry,
      msgtype: 'm.text'
    })
    onBlockWasAddedSuccessfully()
  }

  function selectEntry(e) {
    setSelectedEntry(e.target.value);
  }

  return (
    <div style={{gridColumn: '1 / 3', marginTop: 'var(--margin)'}}>
      <div style={{display: 'flex'}}>
        <select disabled={(Object.keys(entries).length === 0)} onChange={selectEntry} value={selectedEntry} style={{flexGrow: 1, marginRight: 'var(--margin)'}}>
          <option value="" disabled={true}>
            {(
              Object.keys(entries).length === 0
                ? 'no entries'
                : '--- Please Select ---'
            )}
          </option>
          {Object.values(entries).map(entry => (
            <option value={entry.uuid} key={entry.uuid}>{entry.name}</option>
          ))}
        </select>
        <button disabled={!selectedEntry} onClick={handleSubmit} style={{flexBasis: '200px'}}>Add Content</button>
      </div>
    </div>
  )
}

export default PeertubeEmbed
