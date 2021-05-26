import { useState } from 'react';
import './App.css';

function App() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [klasse, setKlasse] = useState('');
  const [colab, setColab] = useState('');
  const [description, setDescription] = useState('');
  return (
    <div className="App">
      <form>
        <div>
          <label htmlfor="subject">Studiengang</label>
          <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} >
            <option value="vk">VK</option>
            <option value="act">Schauspiel</option>
            <option value="clown">Clown</option>
            <option value="Kunst">Kunst</option>
          </select>
          {// sollte es hier die möglichkeit geben mehrere auszuwählen? also studiengang übergreifende projekte
          }
        </div>
        <div>
          <label htmlfor="klasse">Fachklasse</label>
          <select id="klasse" value={klasse} onChange={(e) => setKlasse(e.target.value)} >
            <option value="NewMedia">New Media</option>
            </select>
        </div>
        <div>
          <label htmlfor="title">Title of your Project</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <p id="student">matrixClient.getUserName()</p>
          <label htmlfor="collabbro">Collaborators</label>
          <input type="text" id="collabbro" value={colab} onChange={(e) => setColab(e.target.value)} />
        </div>
        {// vermutlich sollten auch hier mehrere studierende hinzugefügt werden können, evtl dann direkt matrix users durchsuchen fürs richtige zuordnen. 
        }

        <div>
          <label htmlfor="description">Description</label>
          <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <h2 id="peertube">Add Videos</h2>
          <p>fetch(https://stream.udk-berlin.de/api/userId/myVideos)</p>
          <button>redirect to upload on peertube</button>
        </div>
        <div>
          <h2 id="files">Add Files</h2>
          <label htmlfor="title">Upload</label>
          <input type="file" id="myFile" name="filename" />
        </div>
        </form>
    </div>
  );
}

export default App;
