import { useState } from 'react';
import './App.css';

function App() {
  const [title, setTitle] = useState('');

  return (
    <div className="App">
      <form>
        <label htmlfor="title">Title of your Project</label>
        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </form>
    </div>
  );
}

export default App;
