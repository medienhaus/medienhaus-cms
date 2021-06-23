import React, { useState, useEffect } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const Code = ({ onSave, storage, saved, content }) => {
  const [value, setValue] = useState(content)
  useEffect(() => {
    hljs.highlightAll()
  }, [value])
  return (

        <div style={{ height: '100%', width: '100%' }}>
      <textarea
        style={{ height: '100%', width: '100%' }}
        onChange={e => setValue(e.target.value)}
        onBlur={(e) => { storage(value); onSave(e) }}
        value={value}
      />
          <p>{saved}</p>
          <pre><code>{content}</code></pre>
    </div>

  )
}
export default Code
