import React from 'react'
import mapDeep from 'deepdash/es/mapDeep'
import filterDeep from 'deepdash/es/filterDeep'

import config from '../config.json'
import { useTranslation } from 'react-i18next'

function SimpleContextSelect ({ onItemChosen, selectedContext, contexts, struktur, disabled, moderationRooms }) {
  const { t } = useTranslation('context')
  const items = config.medienhaus?.sites?.moderate?.manageContexts?.showRoot ? struktur : struktur[Object.keys(struktur)[0]].children

  return (
    <>
      {/*
      <input id="context-select" list="context-list" name="context-select" placeholder="-- type to search / double-click to select --" type="text" />
      <datalist id="context-list" disabled={disabled} defaultValue={selectedContext} onChange={(e) => { onItemChosen(e.target.value) }}>
      */}
      <select disabled={disabled} defaultValue={selectedContext} onChange={(e) => { onItemChosen(e.target.value) }}>
        <option disabled value="">-- {t('select context')} --</option>
        {mapDeep(filterDeep(items, (value, key, parent, context) => {
          // Exclude all hierarchy elements that are not "contexts"
          if (!value?.type.includes('context')) return false
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
          if (!config.medienhaus?.sites?.moderate?.manageContexts?.showRoot) {
            value.path.unshift(struktur[Object.keys(struktur)[0]].name)
            value.pathIds.unshift(struktur[Object.keys(struktur)[0]].id)
          }
          return true
        }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true }), (value, key, parent, context) => (
          <option key={value.id + key} disabled={(contexts && contexts.some(context => context.room_id === value.id)) || (moderationRooms && !moderationRooms.some(room => room.room_id === value.id))} value={value.id}>{' --- '.repeat(context.depth - 1)}{value.name}</option>
        ), { childrenPath: 'children', includeRoot: false, rootIsChildren: true })}
      </select>
      {/*
      </datalist>
      */}
    </>
  )
}

export default SimpleContextSelect
