import React, { useState } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
hljs.initHighlightingOnLoad()

const Code = ({ onSave, storage, saved, content }) => {
  const [value, setValue] = useState(content)

  return (

    <div>
      <textarea
        style={{ height: '100%', width: '100%' }}
        onChange={e => e.target.value && setValue(e.target.value)}
        onBlur={(e) => { storage(value); onSave(e) }}
        value={value}
      />
      <p>{saved}</p>
              <div style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(value).value }} ></div>
    </div>

  )
}
export default Code
