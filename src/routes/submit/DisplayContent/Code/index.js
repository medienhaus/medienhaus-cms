import React, { useState } from 'react'

const Code = ({ onSave, storage, saved, content }) => {
    const [value, setValue] = useState(content);
    //content && setValue(content)
    
    return (
        <pre>
        <code className="json">
                <textarea
                    style={{height: '100%'}}
            onChange={e => e.target.value && setValue(e.target.value)}
            onBlur={(e) => { storage(value); onSave(e) }}
            value={value}
                />
            </code>
            <p>{saved}</p>
      </pre>
    )
}
export default Code