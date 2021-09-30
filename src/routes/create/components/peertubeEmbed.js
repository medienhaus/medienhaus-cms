import React, { useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { Trans, useTranslation } from 'react-i18next'
// import createBlock from '../matrix_create_room'

const PeertubeEmbed = ({ type, onCreateRoomForBlock, onBlockWasAddedSuccessfully, saveButton, callback }) => {
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([])
  const [selectedEntry, setSelectedEntry] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const username = matrixClient.getUserIdLocalpart()
  const { t } = useTranslation('peertube')

  useEffect(() => {
    async function fetchEntries () {
      setLoading(true)
      const resourceType = (type === 'playlist' ? 'video-playlists' : 'videos')
      const request = process.env.NODE_ENV === 'development' ? await fetch(`https://stream.udk-berlin.de/api/v1/accounts/d.erdmann/${resourceType}?count=100`) : await fetch(`https://stream.udk-berlin.de/api/v1/accounts/${username}/${resourceType}?count=100`)
      // TODO: pagination for more than 100 entries
      let entries = await request.json()

      if (!(entries && entries.data && entries.data.length > 0)) {
        setEntries([])
        setSelectedEntry('')
        setLoading(false)
        return
      }

      entries = entries.data

      if (entries?.length > 0) {
        // Only show live videos for type = "livestream", and non-live videos for type = "video"
        if (type === 'livestream') {
          entries = entries.filter(video => video.isLive)
        } else if (type === 'video') {
          entries = entries.filter(video => !video.isLive)
        }
      }

      setEntries(entries)
      setSelectedEntry('')
      setLoading(false)
    }
    fetchEntries()
  }, [type, username])

  async function handleSubmit () {
    const blockRoomId = await onCreateRoomForBlock()
    await matrixClient.sendMessage(blockRoomId, {
      body: selectedEntry,
      msgtype: 'm.text'
    })
    onBlockWasAddedSuccessfully()
  }

  function selectEntry (e) {
    setSelectedEntry(e.target.value)
    !saveButton && callback(e.target.value)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div>
      <select disabled={entries.length === 0} onChange={selectEntry} value={selectedEntry}>
        <option value="" disabled>
          {(
            entries.length === 0
              ? t('no entries')
              : t('-- please select ') + type + ' --'
          )}
        </option>
        {entries.map(entry => (
          <option value={entry.uuid} key={entry.uuid}>{(type === 'playlist' ? entry.displayName : entry.name)}</option>
        ))}
      </select>
      {type === 'video' && <p>↳ <Trans t={t} i18nKey="linkToVideo">You can upload videos via <a href="https://stream.udk-berlin.de/videos/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>}
      {type === 'livestream' && <p>↳ <Trans t={t} i18nKey="linkToStream">You can start a livestream via <a href="https://stream.udk-berlin.de/videos/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>}
      {type === 'playlist' && <p>↳ <Trans t={t} i18nKey="linkToPlaylist">You can create playlists via <a href="https://stream.udk-berlin.de/videos/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>}
      {saveButton && <LoadingSpinnerButton onClick={handleSubmit} disabled={entries.length < 1 || !selectedEntry}>Add Content</LoadingSpinnerButton>}
    </div>
  )
}

export default PeertubeEmbed
