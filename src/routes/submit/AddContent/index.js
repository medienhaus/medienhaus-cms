import React, {useState} from 'react'
import FileUpload from './FileUpload';
import AddBlock from './AddBlock';

const AddContent = ({number, projectSpace, blocks, reloadProjects}) => {
  const [contentSelect, setContentSelect] = useState('');
  const [isPlusButton, setIsPlusButton] = useState(true);

  const displayPlusButton = (button) => {
    setIsPlusButton(button)
  }

  return (
    <div className="add">
      {isPlusButton ?
        <button key={'add' + number} onBlur={() => setIsPlusButton(true)} onClick={(e) => { e.preventDefault(); setIsPlusButton(false) }} >+</button>
        //onBlur not workin here, no idea why.
      : (
        <>
          <select name="content-select" defaultValue={''} id="content-select" onChange={(e) => setContentSelect(e.target.value)}>
            <option value='' disabled={true} >Select Content</option>
            <option value="none" disabled={true} >--Text------------</option>
            <option value="heading">Heading</option>
            <option value="text">Text</option>
            <option value="" disabled={true} >--Media------------</option>
            <option value="image">Image</option>
            <option value="audio">Audio</option>
          </select>
          {contentSelect === "image" || contentSelect === "audio" ?
            <FileUpload fileType={contentSelect} number={number} space={projectSpace} blocks={blocks} reloadProjects={reloadProjects} displayPlusButton={displayPlusButton} />
          :
            <AddBlock contentSelect={contentSelect} number={number} projectSpace={projectSpace} blocks={blocks} reloadProjects={reloadProjects} displayPlusButton={displayPlusButton} />
          }
          <button onClick={(e) => { e.preventDefault(); setIsPlusButton(true) }} >CANCEL</button>
        </>
      )
    }
    </div>
  )
}
export default AddContent
