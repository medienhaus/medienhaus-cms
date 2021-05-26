import { useState } from 'react';
import './App.css';

function App() {
  const [title, setTitle] = useState('');

  return (
    <div className="App">
      <form>
        <div>
          <label htmlfor="title">Studiengang</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlfor="title">Title of your Project</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        </form>
    </div>
  );
}

export default App;
