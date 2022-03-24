import React from 'react'
import mapDeep from 'deepdash/es/mapDeep'
import filterDeep from 'deepdash/es/filterDeep'
import DeleteButton from '../routes/create/components/DeleteButton'
import styled from 'styled-components'

import config from '../config.json'
import { Loading } from './loading'

const RemovableLiElement = styled.li`
list-style: none;
height: 2em;
margin-bottom: calc(var(--margin)/2);
`
function SimpleContextSelect ({ onItemChosen, selectedContext, contexts, struktur, disabled, loading, handleRemove }) {
  const items = config.medienhaus?.sites?.moderate?.manageContexts?.showRoot ? struktur : struktur[Object.keys(struktur)[0]].children

  return (
    <>
      {contexts?.map((context, index) => {
        return (
          <RemovableLiElement key={context.room_id}>
            <span>{context.name} </span>
            <DeleteButton width="5%" onDelete={() => handleRemove(context.room_id)} />
          </RemovableLiElement>
        )
      })}
      {loading
        ? <Loading />
        : <select disabled={disabled} defaultValue={selectedContext} onChange={(e) => { onItemChosen(JSON.parse(e.target.value)) }}>
          <option disabled value="">-- add to context --</option>
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
            <option key={value.id} value={JSON.stringify(value)}>{' --- '.repeat(context.depth - 1)}{value.name}</option>
          ), { childrenPath: 'children', includeRoot: false, rootIsChildren: true })}
        </select>}
    </>
  )
}

export default SimpleContextSelect
