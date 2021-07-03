import React, { useState } from 'react'
import MediaUpload from './MediaUpload'
import AddBlock from './AddBlock'
import PeertubeEmbed from './peertubeEmbed'
import createBlock from '../matrix_create_room'
import reorder from '../DisplayContent/matrix_reorder_rooms'

const AddContent = ({ number, projectSpace, blocks, reloadProjects }) => {
  const [selectedBlockType, setSelectedBlockType] = useState('')
  const [showBlockTypeSelector, setShowBlockTypeSelector] = useState(false)

  const displayPlusButton = (button) => {
    setShowBlockTypeSelector(!button)
  }

  async function onCreateBlockRoom () {
    // Make some room in our room list by pushing rooms below this room down by 1 index
    blocks.forEach((block, i) => {
      if (i >= number) { reorder(block.name, block.room_id, false) }
    })
    // Actually create a Matrix room for the new block
    return await createBlock(undefined, selectedBlockType, number, projectSpace)
  }

  function onBlockWasAddedSuccessfully () {
    setShowBlockTypeSelector(false)
    reloadProjects()
  }

  // "Collapsed mode": Only show a small '+' button
  if (!showBlockTypeSelector) {
    return (
      <div className="add">
        <button className="add-button" key={'add' + number} onClick={(e) => { e.preventDefault(); setShowBlockTypeSelector(true) }} >+</button>
      </div>
    )
  }

  // "Expanded mode": Show our selector to let the user select which type of content they want to add here
  return (
    <div className="add">
      <select name="content-select" value={selectedBlockType} id="content-select" onChange={(e) => setSelectedBlockType(e.target.value)}>
        <option value="" disabled={true} >Select Content</option>
        <option value="none" disabled={true} >--Text------------</option>
        <option value="heading">Heading</option>
        <option value="text">Text</option>
        <option value="ul">List (unordered)</option>
        <option value="ol">List (ordered)</option>
        <option value="quote">Quote</option>
        <option value="code">Code Block</option>
        <option value="" disabled={true} >--Media------------</option>
        <option value="image">Image</option>
        <option value="audio">Audio</option>
        <option value="video">Video</option>
        <option value="livestream">Livestream</option>
        <option value="playlist">Playlist</option>
      </select>
      <button className="cancel" onClick={(e) => { e.preventDefault(); setShowBlockTypeSelector(false); setSelectedBlockType('') }} >×</button>
      {
        selectedBlockType === 'image' || selectedBlockType === 'audio'
          ? <MediaUpload fileType={selectedBlockType} number={number} space={projectSpace} blocks={blocks} reloadProjects={reloadProjects} displayPlusButton={displayPlusButton} />
          : selectedBlockType === 'video' || selectedBlockType === 'livestream' || selectedBlockType === 'playlist'
            ? <PeertubeEmbed type={selectedBlockType} onCreateRoomForBlock={onCreateBlockRoom} onBlockWasAddedSuccessfully={onBlockWasAddedSuccessfully} />
            : <AddBlock contentSelect={selectedBlockType} number={number} projectSpace={projectSpace} blocks={blocks} reloadProjects={reloadProjects} displayPlusButton={displayPlusButton} />
      }
    </div>
  )
}

export default AddContent
