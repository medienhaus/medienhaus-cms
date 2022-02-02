import React from 'react'
import mapDeep from 'deepdash/es/mapDeep'
import filterDeep from 'deepdash/es/filterDeep'

function SimpleContextSelect ({ onItemChosen, selectedContext, struktur, disabled }) {
  const items = struktur[Object.keys(struktur)[0]].children
  return (
    <>
      <select disabled={disabled} onChange={(e) => { onItemChosen(JSON.parse(e.target.value)) }}>
        <option disabled selected>-- select context --</option>
        {mapDeep(filterDeep(items, (value, key, parent, context) => {
          // Exclude all hierarchy elements that are not "contexts"
          if (!value?.type.includes('structure-element')) return false
          value.path = []
          value.pathIds = []
          function addParentToPath (item) {
            if (item.parentItem.value.name) {
              value.path.unshift(item.parentItem.value.name)
              value.pathIds.unshift(item.parentItem.value.id)
              // Recursion: If this parent has yet another parent item, go check that out
              if (item.parentItem.parentItem) {
                addParentToPath(item.parentItem)
              }
            }
          }
          addParentToPath(context._item)
          return true
        }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true }), (value, key, parent, context) => (
          <option key={value.id} value={JSON.stringify(value)} selected={selectedContext === value.id}>{' --- '.repeat(context.depth - 1)}{value.name}</option>
        ), { childrenPath: 'children', includeRoot: false, rootIsChildren: true })}
      </select>
    </>
  )
}

export default SimpleContextSelect
