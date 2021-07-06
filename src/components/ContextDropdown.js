import React, { useState } from 'react'
import { useCombobox } from 'downshift'
import { get, remove, uniqBy } from 'lodash'
import mapDeep from 'deepdash/es/mapDeep'
import struktur from '../struktur'
import { findValueDeep } from 'deepdash/es/standalone'

const items = uniqBy(mapDeep(struktur, (value, key, parent, context) => {
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

function ContextDropdown () {
  const [inputItems, setInputItems] = useState(items)

  function requestAccessToSpace (e) {
    e.preventDefault()
    e.stopPropagation()
  }

  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps
  } = useCombobox({
    items: inputItems,
    itemToString: (item) => item.name,
    onInputValueChange: ({ inputValue }) => {
      setInputItems(
        items.filter(item =>
          item.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      )
    }
  })

  return (
    <>
      <div style={{ display: 'flex' }} {...getComboboxProps()}>
        <input type="text" placeholder="Category / Context / Course" {...getInputProps()} style={{
          flex: '1 0',
          backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMHB4IiB3aWR0aD0iMzAwcHgiIGZpbGw9InJnYigxMjgsMTI4LDEyOCkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHg9IjBweCIgeT0iMHB4Ij48cG9seWdvbiBwb2ludHM9IjUwIDU3LjEzIDIzLjE5IDMwLjQ2IDE2LjEzIDM3LjU1IDUwIDcxLjIzIDgzLjg2IDM3LjU1IDc2LjgxIDMwLjQ2IDUwIDU3LjEzIj48L3BvbHlnb24+PC9zdmc+)',
          backgroundPosition: 'calc(100% - calc(var(--margin) * 0.2)) 55%',
          backgroundSize: 'var(--margin)',
          backgroundRepeat: 'no-repeat'
        }} />
        <button
          type="button"
          {...getToggleButtonProps()}
          aria-label="toggle menu"
          style={{
            position: 'absolute',
            width: '50px',
            right: '0',
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
            ? { display: 'block', position: 'absolute', overflow: 'auto', maxHeight: '50vh', backgroundColor: 'var(--color-bg)', width: '100%', border: 'solid black', borderWidth: '0 3px 3px 3px' }
            : { display: 'none', position: 'absolute', overflow: 'auto', maxHeight: '50vh', backgroundColor: 'var(--color-bg)', width: '100%', border: 'solid black', borderWidth: '0 3px 3px 3px' }
        }
      >
        {isOpen &&
        inputItems.map((item, index) => (
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
                  <span style={{ display: 'block', paddingLeft: `${i * 15}px` }}>
                    {i !== 0 && <>&raquo; </>}
                    {breadcrumb}
                  </span>
                ))}
              </small>
            </div>
            <button style={{ width: '140px', alignSelf: 'start', flex: '0 0' }} onClick={requestAccessToSpace}>REQUEST</button>
          </li>
        ))}
      </ul>
    </>
  )
}

export default ContextDropdown
