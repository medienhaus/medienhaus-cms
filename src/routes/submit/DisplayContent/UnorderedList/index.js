import React, {useState} from 'react';
  
const Item = ({ list, index, removeItem }) => {
  return (
    <div className="li" style={{display: "flex", flexDirection: 'row', justifyContent: 'space-between' }}>{list.text}<div><button onClick={() => removeItem(index)}>x</button>
      </div>
    </div>
  );
}
  
const ListForm = ({ addItem }) => {
  const [value, setValue] = useState("");

  const handleSubmit = e => {
    e.preventDefault();
    if (!value) return;
    addItem('- ' + value);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        className="input"
        placeholder='add list element ↵'
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </form>
  );
}

const UnorderedList = ({ onSave, storage, populated }) => {
  const elements  = populated?.split('\n')
  const [list, setList] = useState(
    elements ? elements.map(el => {
    let rObj = {}
    rObj['text'] = el
    return rObj
  }) : []);

  console.log(populated);
  const addItem = text => {
    const newList = [...list, { text }];
    setList(newList);
    storage(JSON.stringify(newList))
    onSave()
  };

  const removeItem = index => {
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
    storage(JSON.stringify(newList))
    onSave()
  };


  return (
      <div className="list-unordered" >
        {list.map((todo, index) => (
          <Item
            key={index}
            index={index}
            list={todo}
            removeItem={removeItem}
          />
        ))}
        <ListForm addItem={addItem} />
      </div>
  );
}
export default UnorderedList