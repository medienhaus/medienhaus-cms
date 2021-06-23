import React, { useState } from 'react'

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
    </div>

  )
}
export default Code
