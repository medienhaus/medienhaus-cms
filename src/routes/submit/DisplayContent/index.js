import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import FetchCms from '../../../components/matrix_fetch_cms'
import Editor, {renderToHtml} from "rich-markdown-editor";
import debounce from "lodash/debounce";
import { Loading } from '../../../components/loading'
import AddContent from '../AddContent';
import reorder from './matrix_reorder_rooms';


import { ReactComponent as HeadingIcon } from '../../../assets/icons/remix/h-1.svg'
import { ReactComponent as AudioIcon } from '../../../assets/icons/remix/volume-up-line.svg'
import { ReactComponent as ImageIcon } from '../../../assets/icons/remix/image-line.svg'
import { ReactComponent as TextIcon } from '../../../assets/icons/remix/text.svg';

  const DisplayContent = ({block, index, blocks, projectSpace, reloadProjects}) => {
    const [clicked, setClicked] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [saved, setSaved] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { cms, error, fetching } = FetchCms(block.room_id)
    const json = JSON.parse(block.topic)
    const matrixClient = Matrix.getMatrixClient()

    const onSave = async (roomId) => {
      setReadOnly(true);
      try {
       const save =  await matrixClient.sendMessage(roomId, {
          body: localStorage.getItem(roomId),
          format: 'org.matrix.custom.html',
          msgtype: 'm.text',
          formatted_body: renderToHtml(localStorage.getItem(roomId))
        })
        if ("event_id" in save) {
          setSaved("Saved!")
          setTimeout(() => {
            setSaved()
          },1000)
        }
        // await matrixClient.redactEvent(roomId.room_id, entry.event, null, { 'reason': 'I have my reasons!' })
      } catch (e) {
        console.error('error while trying to save: ' + e)
        setSaved("Couldn't save!")
          setTimeout(() => {
            setSaved()
          },1000)
      } finally {
        setReadOnly(false)
      }
    }


    const onDelete = async (e, roomId, index) => {
      e.preventDefault()
      setDeleting(true)
      setReadOnly(true)
      
      try {
        const count = await matrixClient.getJoinedRoomMembers(roomId)
        Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
          localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(roomId, name)
        })
        matrixClient.leave(roomId)
        blocks.forEach((block, i) => {
          if (i > index) {
            reorder(block.name, block.room_id, true)
          }
        })
        //setCounter(0)
      } catch (err) {
        console.error(err)
        setDeleting(`couldn't delete ${json.type}, please try again or try reloading the page`)
        setTimeout(() => {
          setDeleting()
        },2000)
      }
      finally {
        setDeleting()
      }
      //matrixClient.kick(roomId, userId)
      //matrixClient.leave(roomId)
    }

    const changeOrder = async (e,roomId, name, direction) => {
      e.preventDefault()
      setReadOnly(true)
      //blocks.splice((pos) + direction, 0, blocks.splice(pos, 1).pop())
      const active = name.split('_')
      const order = parseInt(active[0])
      const newOrder = order + direction
      const passive = blocks[newOrder].name.split('_')
      const passiveRoom = blocks[newOrder].room_id
      try {
        await matrixClient.setRoomName(roomId, newOrder + '_' + active[1]).then(
          await matrixClient.setRoomName(passiveRoom, order + '_' + passive[1]).then(
            reloadProjects('reload from DisplayContent changeOrder')
          )
        )//.then(setCounter(0))
      } catch (err) {
        console.error(err);
      } finally {
        setReadOnly(false)
      }
    }

  const string2hash = (string) => {
    console.log(typeof string);
    var hash = 0;
                if (string.length === 0) return hash;
                for (let i = 0; i < string.length; i++) {
                    const char = string.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return hash;
  }

        return (
          fetching
          /*
           * @Andi sort of... hack to keep interface from violently redrawing. We need to see how we deal with this.
           * Too many waterfalls, let's stick to the rivers and the lakes that we're used to.
          */
            ? <div style={{ height: "120px"}}><Loading /></div>
            : error
              ? console.error(error)
              : (
                <div className="editor">
                  <div className="left">
                    <button key={'up_' + block.room_id} disabled={ index === 0 } onClick={(e) => changeOrder(e, block.room_id,  block.name, -1)}>↑</button>
                    <figure className="icon-bg">
                   { json.type === 'heading' ? <HeadingIcon fill='var(--color-fg)' /> : json.type === 'audio' ? <AudioIcon fill='var(--color-fg)' />  : json.type === 'image' ? <ImageIcon fill='var(--color-fg)' />  : <TextIcon fill='var(--color-fg)' /> }
                   </figure>
                    <button key={'down_' + block.room_id} disabled={ index === blocks.length -1 } onClick={(e) => changeOrder(e,block.room_id, block.name, 1)}>↓</button>
                  </div>
                  {cms?.msgtype === 'm.image' ?
                  <img src={matrixClient.mxcUrlToHttp(cms.url)} alt={cms.info.name} key={block.room_id} />
                  : cms?.msgtype === 'm.audio' ?
                  <>
                    <audio controls>
                      <source src={matrixClient.mxcUrlToHttp(cms.url)} />
                    </audio>
                   { /* TODO why section? */}
                    <section id="audio-title">{cms.body}</section>
                  </>  :
                  <div className="center">
                    <Editor
                    dark={window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches}
                    defaultValue={cms?.body}
                    disableExtensions={['blockmenu', 'image', 'embed', 'table', 'tr', 'th', 'td', 'bullet_list', 'ordered_list', 'checkbox_item', 'checkbox_list', 'container_notice', 'blockquote', 'heading', 'hr', 'highlight']}
                    placeholder={json.type}
                    readOnly={readOnly}
                    onSave={({ done }) => {
                      if (localStorage.getItem(block.room_id) !== null && cms !== undefined && string2hash(cms.body) !== string2hash(localStorage.getItem(block.room_id))) {
                        onSave(block.room_id)
                        localStorage.removeItem(block.room_id)
                      } else if(localStorage.getItem(block.room_id) !== null && cms === undefined) {
                        onSave(block.room_id)
                        localStorage.removeItem(block.room_id)
                      }
                    }}
                    onChange={debounce((value) => {
                      const text = value();
                      localStorage.setItem(block.room_id, text);
                     }, 250)}
                    handleDOMEvents={{
                      focus: () => console.log("FOCUS on " + block.room_id),
                      blur: (e) => {
                        if (localStorage.getItem(block.room_id) !== null && cms !== undefined && string2hash(cms.body) !== string2hash(localStorage.getItem(block.room_id))) {
                          onSave(block.room_id)
                          localStorage.removeItem(block.room_id)
                        } else if(localStorage.getItem(block.room_id) !== null && cms === undefined){
                          onSave(block.room_id)
                          localStorage.removeItem(block.room_id)
                        }
                      }
                    }}
                    key={block.room_id} />
                    <p key={block.room_id + "_p"}>{saved}</p> {//feedback that saving was succesfull or has failed
                    }
                  </div>
                  }
                  
                  <div className="right">
                    <button key={'delete' + index} onClick={(e) => {
                      if (clicked) {
                        onDelete(e, block.room_id, index)
                        setClicked(false)
                        reloadProjects('callback from delete button in DisplayContent')
                      } else {
                        e.preventDefault()
                        setClicked(true)
                      }
                      <p>{deleting}</p> //feedback that deleting was succesfull or has failed
                    }}>
                      {clicked ? 'SURE?' : deleting ? <Loading /> : '×'}
                      </button>
                  </div>
                  <AddContent number={index + 1} projectSpace={projectSpace} blocks={blocks} reloadProjects={reloadProjects} />
                </div>
                )
        )
  }
  export default DisplayContent
