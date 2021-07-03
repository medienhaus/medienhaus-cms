import React, { useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import LoadingSpinnerButton from "../../../components/LoadingSpinnerButton";
//import createBlock from '../matrix_create_room'

const PeertubeEmbed = ({ type, onCreateRoomForBlock, onBlockWasAddedSuccessfully }) => {
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState('');
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      const resourceType = (type === 'playlist' ? 'video-playlists' : 'videos')
      const request = await fetch(`https://stream.udk-berlin.de/api/v1/accounts/${(type === 'playlist' ? 'newmediaclass' : 'd.erdmann')}/${resourceType}?count=100`)
      // TODO: pagination for more than 100 entries
      let entries = await request.json()

      if (!(entries && entries.data && entries.data.length > 0)) {
        setEntries([])
        setSelectedEntry('')
        setLoading(false)
        return;
      }

      entries = entries.data

      if (entries?.length > 0) {
        // Only show live videos for type = "livestream", and non-live videos for type = "video"
        if (type === 'livestream') {
          entries = entries.filter(video => video.isLive);
        } else if (type === 'video') {
          entries = entries.filter(video => !video.isLive);
        }
      }

      setEntries(entries)
      setSelectedEntry('')
      setLoading(false)
    }
    fetchEntries()
  }, [type])

  async function handleSubmit() {
    const blockRoomId = await onCreateRoomForBlock()
    await matrixClient.sendMessage(blockRoomId, {
      body: selectedEntry,
      msgtype: 'm.text'
    })
    onBlockWasAddedSuccessfully()
  }

  function selectEntry(e) {
    setSelectedEntry(e.target.value);
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div style={{ gridColumn: '1 / 3', marginTop: 'var(--margin)' }}>
      <div style={{ display: 'flex' }}>
        <select disabled={entries.length === 0} onChange={selectEntry} value={selectedEntry} style={{ flex: '1 0', marginRight: 'var(--margin)' }}>
          <option value="" disabled={true}>
            {(
              entries.length === 0
                ? 'no entries'
                : '--- Please Select ---'
            )}
          </option>
          {entries.map(entry => (
            <option value={entry.uuid} key={entry.uuid}>{(type === 'playlist' ? entry.displayName : entry.name)}</option>
          ))}
        </select>
        <LoadingSpinnerButton onClick={handleSubmit} disabled={entries.length < 1 || !selectedEntry} style={{ flex: '0 1 200px' }}>Add Content</LoadingSpinnerButton>
      </div>
    </div>
  )
}

export default PeertubeEmbed
