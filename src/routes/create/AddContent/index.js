import React, { useState } from 'react'
import MediaUpload from './MediaUpload'
import AddBlock from './AddBlock'
import PeertubeEmbed from '../components/peertubeEmbed'
import AddLocation from './AddLocation'
import AddDate from '../addDate'
import createBlock from '../matrix_create_room'
import reorder from '../DisplayContent/matrix_reorder_rooms'
import BigBlueButtonEmbed from '../components/bigBlueButtonEmbed'
import { useTranslation } from 'react-i18next'
import config from '../../../config.json'

const AddContent = ({ number, projectSpace, blocks, contentType, reloadSpace }) => {
  const [selectedBlockType, setSelectedBlockType] = useState('')
  const [showBlockTypeSelector, setShowBlockTypeSelector] = useState(false)
  const { t } = useTranslation('content')
  const displayPlusButton = (button) => {
    setShowBlockTypeSelector(!button)
  }
  async function onCreateBlockRoom () {
    // Make some room in our room list by pushing rooms below this room down by 1 index
    blocks.forEach((block, i) => {
      if (i >= number) { reorder(block.name, block.room_id, projectSpace, false) }
    })
    // Actually create a Matrix room for the new block
    return await createBlock(undefined, selectedBlockType, number, projectSpace)
  }

  function onBlockWasAddedSuccessfully () {
    setShowBlockTypeSelector(false)
    reloadSpace()
  }

  // "Collapsed mode": Only show a small '+' button
  if (!showBlockTypeSelector) {
    return (
      <div className="add">
        <button className="add-button" key={'add' + number} onClick={(e) => { e.preventDefault(); setShowBlockTypeSelector(true) }}>+</button>
      </div>
    )
  }

  // "Expanded mode": Show our selector to let the user select which type of content they want to add here
  return (
    <>
      <div className="add">
        <select name="content-select" value={selectedBlockType} id="content-select" onChange={(e) => setSelectedBlockType(e.target.value)}>
          <option value="" disabled>{t('-- select content --')}</option>
          <optgroup label="Text">
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('heading')) && <option value="heading">{t('Heading')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('link')) && <option value="link">{t('Link')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('text')) && <option value="text">{t('Text')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('unordered list')) && <option value="ul">{t('List (unordered)')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('ordered list')) && <option value="ol">{t('List (ordered)')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('quote block')) && <option value="quote">{t('Quote Block')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('code block')) && <option value="code">{t('Code Block')}</option>}
          </optgroup>
          <optgroup label="Media">
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('image')) && <option value="image">{t('Image')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('audio')) && <option value="audio">{t('Audio')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('file')) && <option value="file">{t('File')}</option>}

            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('video')) && <option value="video">{t('Video')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('live stream')) && <option value="livestream">{t('Live stream')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('playlist')) && <option value="playlist">{t('Playlist')}</option>}
            {(!config.medienhaus?.item || !config.medienhaus?.item[contentType]?.content || config.medienhaus?.item[contentType]?.content.includes('bigbluebutton')) && <option value="bbb">{t('BigBlueButton-Session')}</option>}

          </optgroup>
        </select>
        <button className="cancel" onClick={(e) => { e.preventDefault(); setShowBlockTypeSelector(false); setSelectedBlockType('') }}>×</button>
      </div>
      {
        selectedBlockType === 'image' || selectedBlockType === 'audio' || selectedBlockType === 'file'
          ? <MediaUpload fileType={selectedBlockType} number={number} space={projectSpace} blocks={blocks} reloadSpace={reloadSpace} displayPlusButton={displayPlusButton} />
          : selectedBlockType === 'video' || selectedBlockType === 'livestream' || selectedBlockType === 'playlist'
            ? <PeertubeEmbed type={selectedBlockType} onCreateRoomForBlock={onCreateBlockRoom} onBlockWasAddedSuccessfully={onBlockWasAddedSuccessfully} />
            : selectedBlockType === 'location'
              ? <AddLocation onCreateRoomForBlock={onCreateBlockRoom} onBlockWasAddedSuccessfully={onBlockWasAddedSuccessfully} />
              : selectedBlockType === 'date'
                ? <AddDate onCreateRoomForBlock={onCreateBlockRoom} onBlockWasAddedSuccessfully={onBlockWasAddedSuccessfully} />
                : selectedBlockType === 'bbb'
                  ? <BigBlueButtonEmbed onCreateRoomForBlock={onCreateBlockRoom} onBlockWasAddedSuccessfully={onBlockWasAddedSuccessfully} saveButton />
                  : <AddBlock contentSelect={selectedBlockType} number={number} projectSpace={projectSpace} blocks={blocks} reloadSpace={reloadSpace} displayPlusButton={displayPlusButton} />
      }
    </>
  )
}
export default AddContent
