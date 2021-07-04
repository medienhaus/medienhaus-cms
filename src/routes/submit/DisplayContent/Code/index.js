import React, { useState } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/vs2015.css'

const Code = ({ onSave, storage, saved, content }) => {
  const [value, setValue] = useState(content || '')

  return (
    /*
    <pre style={{ width: '100%' }}>
      <code className="json">
        <textarea
          style={{ width: '100%' }}
          onChange={e => setValue(e.target.value)}
          onBlur={(e) => { storage(value); onSave(e) }}
          value={value}
        />
      </code>
      <p>{saved}</p>
      {value && <div dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(value).value }}></div>}
    </pre>

    Trying to overlay the two divy
    */
    <div style={{
      position: 'relative'
    }}>
      <pre>
        <code className="json" style={{
          position: 'absolute',
          left: '0',
          top: '0',
          right: '0',
          bottom: '0',
          width: '100%',
          height: '100%'
        }}>
          <textarea
            style={{ height: '100%', opacity: '0.1' }}
            onChange={e => setValue(e.target.value)}
            onBlur={(e) => { storage(value); onSave(e) }}
            value={value}
          />
        </code>

        {<div style={{
          zIndex: '4',
          opacity: '1'
        }} dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(value).value }}></div>}
      </pre>
      <p>{saved}</p>
    </div>

  )
}
export default Code
