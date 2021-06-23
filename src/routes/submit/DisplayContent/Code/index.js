import React, { useState } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/vs2015.css';

const Code = ({ onSave, storage, saved, content }) => {
  const [value, setValue] = useState(content);

  return (
    <pre>
      <code className="json">
        <textarea
          style={{ height: '100%' }}
          onChange={e => setValue(e.target.value)}
          onBlur={(e) => { storage(value); onSave(e) }}
          value={value}
        />
      </code>
      <p>{saved}</p>
      {<div dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(value).value }}></div>}
    </pre>
  )
}
export default Code