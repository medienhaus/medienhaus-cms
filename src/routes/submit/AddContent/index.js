import React, { useState } from 'react'
import MediaUpload from './MediaUpload'
import AddBlock from './AddBlock'
import PeertubeEmbed from "./peertubeEmbed";

const AddContent = ({ number, projectSpace, blocks, reloadProjects }) => {
  const [contentSelect, setContentSelect] = useState('')
  const [isPlusButton, setIsPlusButton] = useState(true)

  const displayPlusButton = (button) => {
    setIsPlusButton(button)
  }

  return (
    <div className="add">
      {isPlusButton
        ? <button className="add-button" key={'add' + number} onBlur={() => setIsPlusButton(true)} onClick={(e) => { e.preventDefault(); setIsPlusButton(false) }} >+</button>
        // onBlur not workin here, no idea why.
        : (
          <>
            <select name="content-select" defaultValue={''} id="content-select" onChange={(e) => setContentSelect(e.target.value)}>
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
            <button className="cancel" onClick={(e) => { e.preventDefault(); setIsPlusButton(true) }} >×</button>
            {
              contentSelect === 'image' || contentSelect === 'audio'
                ? <MediaUpload fileType={contentSelect} number={number} space={projectSpace} blocks={blocks} reloadProjects={reloadProjects} displayPlusButton={displayPlusButton} />
              : contentSelect === 'video' || contentSelect === 'livestream' || contentSelect === 'playlist'
                ? <PeertubeEmbed type={contentSelect} />
                : <AddBlock contentSelect={contentSelect} number={number} projectSpace={projectSpace} blocks={blocks} reloadProjects={reloadProjects} displayPlusButton={displayPlusButton} />
            }
          </>
        )
      }
    </div>
  )
}
export default AddContent
