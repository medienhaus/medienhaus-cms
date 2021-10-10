import React from 'react'
function DisplayBbb (props) {
  return (
    <div className="center">
      <div>
        <p>BigBlueButton-Session via:</p>
        <br />
        <p><a href={props.cms?.body} target="_blank" rel="external nofollow noopener noreferrer">{props.cms?.body}</a></p>
      </div>
    </div>
  )
}
export default DisplayBbb
