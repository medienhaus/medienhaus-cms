// Can't copy/paste full lists into the UI. Only one element at a time.

import React, { useState } from 'react'

const Item = ({ list, index, removeItem }) => {
  return (
    <div>{list.text}<button onClick={() => removeItem(index)}>×</button></div>
    // <li>{list.text}<button className="no-bg" onClick={() => removeItem(index)}>×</button></li>
  )
}

const ListForm = ({ addItem, index, type }) => {
  const [value, setValue] = useState('')
  const handleSubmit = e => {
    e.preventDefault()
    if (!value) return
    addItem(type === 'ol' ? index + '. ' + value : '- ' + value)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        className="input"
        placeholder="add list element ↵"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </form>
  )
}

const List = ({ onSave, storage, populated, type }) => {
  const elements = populated?.split('\n')
  const [list, setList] = useState(
    elements
      ? elements.map(el => {
        const rObj = {}
        rObj.text = el
        return rObj
      })
      : [])

  const addItem = text => {
    const newList = [...list, { text }]
    console.log(newList)
    setList(newList)
    storage(JSON.stringify(newList))
    onSave()
  }

  const removeItem = index => {
    const newList = [...list]
    newList.splice(index, 1)
    setList(newList)
    storage(JSON.stringify(newList))
    onSave()
  }

  return (
    <div className="list">
      {list.map((item, index) => (
        <Item
          key={index}
          index={index}
          list={item}
          removeItem={removeItem}
        />
      ))}
      <ListForm addItem={addItem} type={type} index={list.length + 1} />
    </div>
  )
}
export default List
