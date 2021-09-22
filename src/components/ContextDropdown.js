import React, { useEffect, useState } from 'react'
import { useCombobox } from 'downshift'
import _, { find, get, map, orderBy, remove, uniqBy } from 'lodash'
import mapDeep from 'deepdash/es/mapDeep'
import struktur from '../struktur'
import { findValueDeep } from 'deepdash/es/standalone'
import LoadingSpinnerButton from './LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'
import Fuse from 'fuse.js'
import Matrix from '../Matrix'
// @TODO return course if no request button
let items = uniqBy(mapDeep(struktur, (value, key, parent, context) => {
  // Add "path" parameter to create breadcrumbs from first hierarchy element up to "myself"
  value.path = remove(context._item.path, spaceId => spaceId !== 'children')
  // Remove myself from breadcrumbs
  value.path.pop()
  // Remove "UdK" from breadcrumbs
  value.path.shift()
  // Replace space IDs with their corresponding names
  value.path = value.path.map((spaceId) => {
    return get(findValueDeep(struktur, (value, key) => key === spaceId, { leavesOnly: false, childrenPath: 'children', includeRoot: false, rootIsChildren: true }), 'name')
  })
  delete value.children
  return value
}, { leavesOnly: true, childrenPath: 'children', includeRoot: false, rootIsChildren: true }), 'id')

function ContextDropdown ({ onItemChosen, selectedContext, showRequestButton = false }) {
  const [inputItems, setInputItems] = useState(items)
  const [currentlyShownInputItems, setCurrentlyShownInputItems] = useState(items)
  const { t } = useTranslation('context')

  async function requestAccessToSpace (contextSpaceId) {
    const req = {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({
        reason: 'knock-knock'
      })
    }
    await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/unstable/knock/${contextSpaceId}`, req)
  }

  useEffect(() => {
    // Make sure we mark the contexts as "member" where we are a member of already
    async function markJoinedContexts () {
      const joinedRooms = await Matrix.getMatrixClient().getJoinedRooms()
      for (const i in joinedRooms.joined_rooms) {
        const contextWeAreMemberOf = _.find(items, { id: joinedRooms.joined_rooms[i] })
        if (!contextWeAreMemberOf) continue
        contextWeAreMemberOf.member = true
      }
      items = orderBy(items, 'member', 'asc')
      setInputItems(items)
      setCurrentlyShownInputItems(items)
    }

    if (showRequestButton) {
      markJoinedContexts()
    }
  }, [showRequestButton, setInputItems])

  const fuse = new Fuse(inputItems, {
    keys: ['name']
  })

  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    reset
  } = useCombobox({
    items: currentlyShownInputItems,
    selectedItem: find(inputItems, { id: selectedContext }),
    itemToString: (item) => item.name,
    onInputValueChange: ({ inputValue }) => {
      if (!inputValue) { setCurrentlyShownInputItems(inputItems) }
      setCurrentlyShownInputItems(
        map(fuse.search(inputValue), 'item')
      )
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (!selectedItem) { return }
      if (!selectedItem.member) {
        // clear the combobox again if the user selected a context they are not a member of yet
        reset()
        return
      }
      onItemChosen(selectedItem.id)
    }
  })

  return (
    <>
      <div style={{ display: 'flex' }} {...getComboboxProps()}>
        <input
          type="text" placeholder={t('-- search or select context --')} {...getInputProps()} style={{
            flex: '1 0',
            backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMHB4IiB3aWR0aD0iMzAwcHgiIGZpbGw9InJnYigxMjgsMTI4LDEyOCkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHg9IjBweCIgeT0iMHB4Ij48cG9seWdvbiBwb2ludHM9IjUwIDU3LjEzIDIzLjE5IDMwLjQ2IDE2LjEzIDM3LjU1IDUwIDcxLjIzIDgzLjg2IDM3LjU1IDc2LjgxIDMwLjQ2IDUwIDU3LjEzIj48L3BvbHlnb24+PC9zdmc+)',
            backgroundPosition: 'calc(100% - calc(var(--margin) * 0.2)) 55%',
            backgroundSize: 'var(--margin)',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <button
          type="button"
          {...getToggleButtonProps()}
          aria-label="toggle menu"
          style={{
            position: 'absolute',
            width: '50px',
            right: '0',
            bottom: '0',
            top: '0',
            background: 'none',
            border: 'none',
            color: 'transparent'
          }}
        >
          &#8595;
        </button>
      </div>
      <ul
        {...getMenuProps()}
        style={
          isOpen
            ? { display: 'block', position: 'absolute', overflow: 'auto', maxHeight: '50vh', backgroundColor: 'var(--color-bg)', width: '100%', border: 'solid black', borderWidth: '0 3px 3px 3px', zIndex: 9999 }
            : { display: 'none', position: 'absolute', overflow: 'auto', maxHeight: '50vh', backgroundColor: 'var(--color-bg)', width: '100%', border: 'solid black', borderWidth: '0 3px 3px 3px', zIndex: 9999 }
        }
      >
        {isOpen && currentlyShownInputItems.map((item, index) => (
          <li
            style={
              highlightedIndex === index
                ? { padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
                : { padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
            }
            key={`${item.id}${index}`}
            {...getItemProps({ item, index })}
          >
            <div style={{ display: 'block' }}>
              {item.name}
              <br />
              <small style={{ color: 'gray' }}>
                {item.path.map((breadcrumb, i) => (
                  <span style={{ display: 'block', paddingLeft: `${i * 15}px` }} key={i + breadcrumb}>
                    {i !== 0 && <>&raquo; </>}
                    {breadcrumb}
                  </span>
                ))}
              </small>
            </div>
            {showRequestButton && !item.member && (
              <LoadingSpinnerButton
                onClick={() => requestAccessToSpace(item.id)}
                stopPropagationOnClick
                style={{ width: '140px', alignSelf: 'start', flex: '0 0' }}
              >
                REQUEST
              </LoadingSpinnerButton>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

export default ContextDropdown
