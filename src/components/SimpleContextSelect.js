import React from 'react'
import mapDeep from 'deepdash/es/mapDeep'
import filterDeep from 'deepdash/es/filterDeep'

function SimpleContextSelect ({ onItemChosen, selectedContext, struktur }) {
  const items = struktur[Object.keys(struktur)[0]].children

  return (
    <>
      <select onChange={(e) => { onItemChosen({ id: e.target.value }) }}>
        <option>&nbsp;</option>
        {mapDeep(filterDeep(items, (value, key, parent, context) => {
          // Exclude all hierarchy elements that are not "contexts"
          if (value?.type !== 'context') return false
          return true
        }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true }), (value, key, parent, context) => (
          <option key={value.id} value={value.id} selected={selectedContext === value.id}>{' --- '.repeat(context.depth - 1)}{value.name}</option>
        ), { childrenPath: 'children', includeRoot: false, rootIsChildren: true })}
      </select>
    </>
  )
}

export default SimpleContextSelect
