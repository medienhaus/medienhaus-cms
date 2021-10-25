import React, { useEffect, useState } from 'react'
import { useCombobox } from 'downshift'
import { find, map, sortBy, uniq, uniqBy } from 'lodash'
import mapDeep from 'deepdash/es/mapDeep'
import struktur from '../struktur'
import strukturDev from '../struktur-dev'
import LoadingSpinnerButton from './LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'
import Fuse from 'fuse.js'
import Matrix from '../Matrix'
import { makeRequest } from '../Backend'

const items = uniqBy(mapDeep(process.env.NODE_ENV === 'development' ? strukturDev['!ijJyXjLNqgeJkRerIG:dev.medienhaus.udk-berlin.de'].children : struktur['!TCqCDYYsBUxmjWOZWV:content.udk-berlin.de'].children, (value, key, parent, context) => {
  // Recursively loop through all parents to add them to the "path" which we later on need for displaying breadcrumbs
  value.path = []
  function addParentToPath (item) {
    if (item.parentItem.value.name) {
      value.path.unshift(item.parentItem.value.name)
      // Recursion: If this parent has yet another parent item, go check that out
      if (item.parentItem.parentItem) {
        addParentToPath(item.parentItem)
      }
    }
  }
  addParentToPath(context._item)

  return value
}, { childrenPath: 'children', includeRoot: false, rootIsChildren: true }), 'id')

function ContextDropdown ({ onItemChosen, selectedContext, showRequestButton = false }) {
  const [joinedRooms, setJoinedRooms] = useState([])
  const [inputItems, setInputItems] = useState(items)
  const [requestedContexts, setRequestedContexts] = useState([])
  const { t } = useTranslation('context')

  async function requestAccessToSpace (contextSpaceId) {
    const knockResult = await makeRequest('rundgang/knock', { contextSpaceId })

    if (knockResult.joined) {
      // we automatically joined the space!
      setJoinedRooms(uniq([contextSpaceId, ...requestedContexts]))
    } else {
      // Add the space ID to the list of requested contexts
      setRequestedContexts(uniq([contextSpaceId, ...requestedContexts]))
    }
  }

  useEffect(() => {
    async function fetchJoinedRooms () {
      const joinedRooms = (await Matrix.getMatrixClient().getJoinedRooms()).joined_rooms
      setJoinedRooms(joinedRooms)
      setInputItems(prevState => {
        return sortBy(prevState, item => {
          return !joinedRooms.includes(item.id)
        })
      })
    }

    if (showRequestButton) {
      fetchJoinedRooms()
    }
  }, [showRequestButton])

  // Set up our fuzzy search engine
  const fuse = new Fuse(items, {
    keys: ['name'],
    threshold: 0.25,
    ignoreLocation: true,
    findAllMatches: true
  })

  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    getItemProps,
    inputValue,
    selectedItem
  } = useCombobox({
    items: inputItems,
    selectedItem: find(inputItems, { id: selectedContext }),
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
        {(inputValue && showRequestButton && inputItems.filter(item => joinedRooms.includes(item.id)).length < 1 && inputItems.length > 0) && (
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
            // >It looks like you currently do not have access to any contexts matching “{inputValue}”. Please <Link to="/request" target="_blank" rel="noopener noreferrer">/request</Link> access below.</div>
            >It looks like you currently do not have access to any contexts matching “{inputValue}”.</div>
          </li>
        )}
        {(inputValue && inputItems.length < 1) && (
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
            // >We could not find any contexts matching your search query. If you think your context is missing please use our <Link to="/request" target="_blank" rel="noopener noreferrer">/request</Link> form.</div>
            >We could not find any contexts matching your search query.</div>
          </li>
        )}
        {inputItems.map((item, index) => {
          const disabledClass = showRequestButton && !joinedRooms.includes(item.id) ? 'disabled' : ''
          const selectedClass = item === selectedItem ? 'selected' : ''
          return (
            <li
              key={`${item.id}${index}`}
              className={`${disabledClass} ${selectedClass}`}
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
          )
        })}
      </ul>
    </div>
  )
}

export default ContextDropdown
