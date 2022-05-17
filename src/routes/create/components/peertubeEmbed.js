import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { Trans, useTranslation } from 'react-i18next'

const PeertubeEmbed = ({ type, onCreateRoomForBlock, onBlockWasAddedSuccessfully, saveButton, callback }) => {
  const [selectedEntry, setSelectedEntry] = useState('')
  const [pastedEntry, setPastedEntry] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('peertube')

  async function handleSubmit () {
    const blockRoomId = await onCreateRoomForBlock()
    await matrixClient.sendMessage(blockRoomId, {
      body: selectedEntry,
      msgtype: 'm.text'
    })
    onBlockWasAddedSuccessfully()
  }

  function pasteEntry (e) {
    setSelectedEntry(e.target.value.substring(e.target.value.lastIndexOf('/') + 1))
    setPastedEntry(e.target.value)
    !saveButton && callback(e.target.value)
  }
  const validInputValue = pastedEntry.startsWith('https://stream.udk-berlin.de/')

  return (
    <div>
      <p>{t('Paste a link to your {{type}} below', { type })}:</p>
      <input type="text" value={pastedEntry} onChange={pasteEntry} placeholder="https://stream.udk-berlin.de/…" />
      {type === 'video' && <p>↳ <Trans t={t} i18nKey="linkToVideo">You can upload videos via <a href="https://stream.udk-berlin.de/videos/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>}
      {type === 'livestream' && <p>↳ <Trans t={t} i18nKey="linkToStream">You can start a live stream via <a href="https://stream.udk-berlin.de/videos/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>}
      {type === 'playlist' && <p>↳ <Trans t={t} i18nKey="linkToPlaylist">You can create playlists via <a href="https://stream.udk-berlin.de/videos/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>}

      {saveButton && <LoadingSpinnerButton onClick={handleSubmit} disabled={!selectedEntry || !validInputValue}>Add Content</LoadingSpinnerButton>}
    </div>
  )
}

export default PeertubeEmbed
