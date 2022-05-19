import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { Trans, useTranslation } from 'react-i18next'

const PeertubeEmbed = ({ type, onCreateRoomForBlock, onBlockWasAddedSuccessfully }) => {
  const [inputValue, setInputValue] = useState('')
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('peertube')

  async function handleSubmit () {
    const blockRoomId = await onCreateRoomForBlock()
    await matrixClient.sendMessage(blockRoomId, {
      body: inputValue.substring(inputValue.lastIndexOf('/') + 1),
      msgtype: 'm.text'
    })
    onBlockWasAddedSuccessfully()
  }

  function pasteEntry (e) {
    setInputValue(e.target.value)
  }
  const validInputValue = inputValue.startsWith('https://stream.udk-berlin.de/')

  return (
    <div>
      <p>{t('Paste a link to your {{type}} below', { type })}:</p>
      <input type="text" value={inputValue} onChange={pasteEntry} placeholder="https://stream.udk-berlin.de/…" />
      {type === 'video' && <p>↳ <Trans t={t} i18nKey="linkToVideo">You can upload videos via <a href="https://stream.udk-berlin.de/videos/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>}
      {type === 'livestream' && <p>↳ <Trans t={t} i18nKey="linkToStream">You can start a live stream via <a href="https://stream.udk-berlin.de/videos/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>}
      {type === 'playlist' && <p>↳ <Trans t={t} i18nKey="linkToPlaylist">You can create playlists via <a href="https://stream.udk-berlin.de/videos/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>}

      <LoadingSpinnerButton onClick={handleSubmit} disabled={!validInputValue}>Add Content</LoadingSpinnerButton>
    </div>
  )
}

export default PeertubeEmbed
