import React, { useState } from 'react'

const Tools = () => {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [klasse, setKlasse] = useState('')
  // const [colab, setColab] = useState('');
  // const [description, setDescription] = useState('');

  return (
     <form>
          <div>
            <label htmlFor="subject">Studiengang</label>
            <select id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="vk">VK</option>
              <option value="act">Schauspiel</option>
              <option value="clown">Clown</option>
              <option value="kunst">Kunst</option>
            </select>
            {
            // sollte es hier die möglichkeit geben mehrere auszuwählen? also studiengang übergreifende projekte
            }
          </div>
          <div>
            <label htmlFor="klasse">Fachklasse</label>
            <select id="klasse" name="klasse" value={klasse} onChange={(e) => setKlasse(e.target.value)}>
              <option value="newmedia">New Media</option>
            </select>
          </div>
          <div>
            <label htmlFor="title">Project Title</label>
            <input id="title" name="title" placeholder="project title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {/*
          <div>
            <p id="student">matrixClient.getUserName()</p>
            <label htmlFor="collab">Collaborators</label>
            <input id="collab" name="collab" type="text" value={colab} onChange={(e) => setColab(e.target.value)} />
          </div>
          */}
          {
          // vermutlich sollten auch hier mehrere studierende hinzugefügt werden können, evtl dann direkt matrix users durchsuchen fürs richtige zuordnen
          }
          <div className="grid">
            <button>Add Text</button>
            <button>Add Image</button>
            <button>Add Video</button>
            <button>Add Audio</button>
            {/*
            // fetch("https://stream.udk-berlin.de/api/userId/myVideos")
            */}
          </div>
          <div>
            <label htmlFor="checkbox">Check Box</label>
            <input id="checkbox" name="checkbox" type="checkbox" />
          </div>
          <div>
            <label htmlFor="color">Add Color</label>
            <input id="color" name="color" type="color" />
          </div>
          <div>
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" placeholder="u.name@udk-berlin.de" type="email" />
          </div>
          <div>
            <label htmlFor="file">Files</label>
            <input id="file" name="file" type="file" />
          </div>
          <div>
            <label htmlFor="number">Number</label>
            <input id="number" name="number" placeholder="0" type="number" />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" placeholder="••••••••••••••••••••••••" type="password" />
          </div>
          <div>
            <label htmlFor="radio01">Radio #01</label>
            <input id="radio01" name="radio" type="radio" />
            <label htmlFor="radio02">Radio #02</label>
            <input id="radio02" name="radio" type="radio" />
            <label htmlFor="radio03">Radio #03</label>
            <input id="radio03" name="radio" type="radio" />
          </div>
          <div>
            <label htmlFor="range">Range</label>
            <input id="range" name="range" type="range" />
          </div>
          <div>
            <label htmlFor="search">Search</label>
            <input id="search" name="search" placeholder="search …" type="search" />
          </div>
          <div>
            <label htmlFor="submit">Submit</label>
            <input id="submit" name="submit" type="submit" value="SUBMIT" />
          </div>
          <div>
            <label htmlFor="tel">Tel</label>
            <input id="tel" name="tel" placeholder="+49 30 3185 0" type="tel" />
          </div>
          <div>
            <label htmlFor="text">Text</label>
            <input id="text" name="text" placeholder="some text" type="text" />
          </div>
          <div>
            <label htmlFor="textarea">Textarea</label>
            <textarea id="textarea" name="textarea" placeholder="some text" type="textarea" />
          </div>
          <div>
            <label htmlFor="time">Time</label>
            <input id="time" name="time" type="time" />
          </div>
          <div>
            <label htmlFor="url">URL</label>
            <input id="url" name="url" placeholder="https://udk-berlin.de/example/" type="url" />
          </div>
        </form>
  )
}
/*
<section id="team">
        <h2><strong>Team</strong> (sorted alphabetically):</h2>
        <ul>
          <li>Alexej Bormatenkow</li>
          <li>Dirk Erdmann</li>
          <li><a href="mailto:kg@udk-berlin.de?subject=medienhaus/" rel="external nofollow noreferrer">Klaus Gasteier</a></li>
          <li>Marcel Haupt</li>
          <li><a href="mailto:dh@udk-berlin.de?subject=medienhaus/" rel="external nofollow noreferrer">Daniel Hromada</a></li>
          <li>Frederik Müller</li>
          <li>Andi Rueckel</li>
          <li>Merani Schilcher</li>
          <li><a href="mailto:rfws@udk-berlin.de?subject=medienhaus/" rel="external nofollow noreferrer">Robert Schnüll</a></li>
          <li>Paul Seidler</li>
        </ul>
      </section>
*/

export default Tools
