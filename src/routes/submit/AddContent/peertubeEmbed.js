import React, {useEffect, useState} from 'react'
import Matrix from '../../../Matrix'
import createBlock from '../matrix_create_room'

const PeertubeEmbed = ({type}) => {
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

  // const handleSubmission = async (e, selectedFile, fileName) => {
  //   e.preventDefault()
  //   setLoading(true)
  //   try {
  //     props.displayPlusButton(true)
  //     props.reloadProjects('callback from FileUpload component')
  //     setLoading(false)
  //
  //     // setCounter(0)
  //     // })
  //   } catch (e) {
  //     console.log('error while trying to save image: ' + e)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  function handleSubmit() {

  }

  function selectEntry(e) {
    setSelectedEntry(e.target.value);
  }

  return (
    <div>
      <select disabled={(Object.keys(entries).length === 0)} onChange={selectEntry} value={selectedEntry}>
        <option value="" disabled={true}>
          {(
            Object.keys(entries).length === 0
              ? 'no entries'
              : '--- please select ---'
          )}
        </option>
        {Object.values(entries).map(entry => (
          <option value={entry.id} key={entry.id}>{entry.name}</option>
        ))}
      </select>
      <button disabled={!selectedEntry} onClick={handleSubmit}>Go</button>
    </div>
  )
}

export default PeertubeEmbed
