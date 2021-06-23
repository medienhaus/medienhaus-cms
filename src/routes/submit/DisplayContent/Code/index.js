import React, { useState, useEffect } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const Code = ({ onSave, storage, saved, content }) => {
  const [value, setValue] = useState(content)
  useEffect(() => {
    const blocks = document.querySelectorAll('pre code')
    blocks.forEach(hljs.highlightBlock)
  }, [value])

  return (

    <div>
      <textarea
        style={{ height: '100%', width: '100%' }}
        onChange={e => e.target.value && setValue(e.target.value)}
        onBlur={(e) => { storage(value); onSave(e) }}
        value={value}
      />
      <p>{saved}</p>
      <pre style={{ width: '100%' }}>
        <code style={{ width: '100%' }}>{value}</code>
      </pre>

    </div>

  )
}
export default Code
