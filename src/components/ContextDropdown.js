import React, { useEffect, useState } from 'react'
import { useCombobox } from 'downshift'
import { find, get, map, remove, sortBy, uniq, uniqBy } from 'lodash'
import mapDeep from 'deepdash/es/mapDeep'
import struktur from '../struktur'
import strukturDev from '../struktur-dev'
import { findValueDeep } from 'deepdash/es/standalone'
import LoadingSpinnerButton from './LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'
import Fuse from 'fuse.js'
import Matrix from '../Matrix'
import { Link } from 'react-router-dom'
import { makeRequest } from '../Backend'

const items = uniqBy(mapDeep(process.env.NODE_ENV === 'development' ? strukturDev : struktur, (value, key, parent, context) => {
  // Add "path" parameter to create breadcrumbs from first hierarchy element up to "myself"
  value.path = remove(context._item.path, spaceId => spaceId !== 'children')
  // Remove myself from breadcrumbs
  value.path.pop()
  // Remove "UdK" from breadcrumbs
  value.path.shift()
  // Replace space IDs with their corresponding names
  value.path = value.path.map((spaceId) => {
    return get(findValueDeep(process.env.NODE_ENV === 'development' ? strukturDev : struktur, (value, key) => key === spaceId, { leavesOnly: false, childrenPath: 'children', includeRoot: false, rootIsChildren: true }), 'name')
  })
  delete value.children
  return value
}, { leavesOnly: true, childrenPath: 'children', includeRoot: false, rootIsChildren: true }), 'id')

function ContextDropdown ({ onItemChosen, selectedContext, showRequestButton = false }) {
  const [inputItems, setInputItems] = useState(items)
  const [joinedRooms, setJoinedRooms] = useState([])
  const [requestedContexts, setRequestedContexts] = useState([])
  const { t } = useTranslation('context')

  async function fetchJoinedRooms () {
    setJoinedRooms((await Matrix.getMatrixClient().getJoinedRooms()).joined_rooms)
  }

  async function requestAccessToSpace (contextSpaceId) {
    const knockResult = await makeRequest('rundgang/knock', { contextSpaceId })

    if (knockResult.joined) {
      // we automatically joined the space!
      return fetchJoinedRooms()
    } else {
      // Add the space ID to the list of requested contexts
      setRequestedContexts(uniq([contextSpaceId, ...requestedContexts]))
    }
  }

  useEffect(() => {
    if (showRequestButton) {
      fetchJoinedRooms()
    }
  }, [showRequestButton])

  // Set up our fuzzy search engine
  const fuse = new Fuse(items, {
    keys: ['name']
  })

  // Sort our contexts by if we are a member of them already or not
  const sortedInputItems = sortBy(inputItems, item => {
    return !joinedRooms.includes(item.id)
  })

  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    getItemProps,
    inputValue
  } = useCombobox({
    items: sortedInputItems,
    selectedItem: find(sortedInputItems, { id: selectedContext }),
    itemToString: (item) => item.name,
    onInputValueChange: ({ inputValue }) => {
      if (!inputValue) {
        setInputItems(items)
      }
      setInputItems(
        map(fuse.search(inputValue), 'item')
      )
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (!selectedItem) { return }
      if (!joinedRooms.includes(selectedItem.id)) {
        // clear the combobox again if the user selected a context they are not a member of yet
        return
      }
      onItemChosen(selectedItem.id)
    }
  })

  return (
    <div className="contextDropdown">
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
            ? { display: 'block' }
            : { display: 'none' }
        }
      >
        {(inputValue && showRequestButton && sortedInputItems.filter(item => joinedRooms.includes(item.id)).length < 1 && sortedInputItems.length > 0) && (
          <li
            className="disabled" style={{
              borderBottom: '2px solid var(--color-fg)',
              padding: '10px'
            }}
          >
            <div style={{
              display: 'block',
              opacity: '1',
              width: '100%',
              background: '#dedede',
              borderRadius: '5px',
              margin: '0',
              padding: '15px',
              textAlign: 'center'
            }}
            >It looks like you currently do not have access to any contexts matching "{inputValue}". Please request access below.</div>
          </li>
        )}
        {(inputValue && sortedInputItems.length < 1) && (
          <li
            className="disabled" style={{
              padding: '10px'
            }}
          >
            <div style={{
              display: 'block',
              opacity: '1',
              width: '100%',
              background: '#dedede',
              borderRadius: '5px',
              margin: '0',
              padding: '15px',
              textAlign: 'center'
            }}
            >We could not find any contexts matching your search query. If you think your context is missing please use our <Link to="/request" target="_blank">/request</Link> form.</div>
          </li>
        )}
        {sortedInputItems.map((item, index) => (
          <li
            key={`${item.id}${index}`}
            className={showRequestButton && !joinedRooms.includes(item.id) ? 'disabled' : ''}
            {...getItemProps({ item, index })}
          >
            <div>
              {item.name}
              <br />
              <small>
                {item.path.map((breadcrumb, i) => (
                  <div key={i + breadcrumb} style={{ position: 'relative' }}>
                    {i !== 0 && <span style={{ position: 'absolute', left: `${(i - 1) * 25}px` }}>↳ </span>}
                    <span style={{ display: 'block', paddingLeft: `${i * 25}px` }}>
                      {breadcrumb}
                    </span>
                  </div>
                ))}
              </small>
            </div>
            {showRequestButton && !joinedRooms.includes(item.id) && (
              <LoadingSpinnerButton
                disabled={requestedContexts.includes(item.id)}
                onClick={() => requestAccessToSpace(item.id)}
                stopPropagationOnClick
                style={{ width: '140px', alignSelf: 'start', flex: '0 0' }}
              >
                {requestedContexts.includes(item.id) ? 'REQUESTED' : 'REQUEST'}
              </LoadingSpinnerButton>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ContextDropdown
