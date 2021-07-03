
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import powerMove from '../../../components/matrix_power_move'


const ProjectTitle = ({ joinedSpaces, title, projectSpace, callback }) => {
    const [projectTitle, setProjectTitle] = useState('')
    const [edit, setEdit] = useState(false)
    const [changing, setChanging] = useState(false)
    const [newProject, setNewProject] = useState(false)
    const [oldTitle, setOldTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const matrixClient = Matrix.getMatrixClient()
    const doublicate = joinedSpaces?.filter(({ name }) => projectTitle === name).length > 0
    const history = useHistory()

    useEffect(() => {
        setProjectTitle(title)
        title === '' && setNewProject(true)
        // eslint-disable-next-line
    }, [title]);

    const createProject = async (e, title) => {
        e.preventDefault()
        setLoading(true)

        const opts = {
            preset: 'private_chat',
            name: title,
            creation_content: { type: 'm.space' },
            initial_state: [{
                type: 'm.room.history_visibility',
                content: { history_visibility: 'world_readable' }
            },
            {
                type: 'm.room.topic',
                content: { topic: JSON.stringify({ rundgang: 21, type: 'studentproject' }) }
            },
            {
                type: 'm.room.guest_access',
                state_key: '',
                content: { guest_access: 'can_join' }
            }],
            power_level_content_override: {
                "ban": 50,
                "events": {
                    "m.room.name": 50,
                    "m.room.power_levels": 50
                },
                "events_default": 0,
                "invite": 50,
                "kick": 50,
                "notifications": {
                    "room": 20
                },
                "redact": 50,
                "state_default": 50,
                "users_default": 0

            },
            visibility: 'private'
        }
        try {
            await matrixClient.createRoom(opts)
                .then(async (response) => {
                    return await powerMove(response.room_id)
                }).then((res) => history.push(`/submit/${res}`))
        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div>
                <label htmlFor="title">Project Title</label>
                <input id="title" name="title" placeholder="project title" type="text" value={projectTitle} disabled={title && !edit} onChange={(e) => setProjectTitle(e.target.value)} />
            </div>
            <div>

                {title && <input
                    id="submit" name="submit" type="submit" value={edit ? 'Save' : changing ? <Loading /> : 'Edit Title'} onClick={async (e) => {
                        e.preventDefault()
                        if (edit) {
                            setChanging(true)
                            try {
                                await matrixClient.setRoomName(projectSpace, projectTitle).then(() => callback(projectTitle))
                            } catch (err) {
                                console.error(err)
                            } finally {
                                setChanging(false)
                            }
                            setEdit(false)
                        } else {
                            setEdit(true)
                            setOldTitle(title)
                        }
                    }}
                />}
                {edit && <input id="submit" name="submit" type="submit" value="Cancel" onClick={(e) => { e.preventDefault(); setEdit(false); setProjectTitle(oldTitle) }} />}
                {loading
                    ? <Loading />
                    : !title && <input
                        id="submit" name="submit" type="submit" value={newProject ? 'Create Project' : 'New Project'} disabled={(newProject && doublicate) || !projectTitle} onClick={(e) => {
                            console.log(newProject)
                            if (newProject) {
                                createProject(e, projectTitle)
                                setNewProject(false)
                            } else {
                                e.preventDefault()
                                setNewProject(true)
                            }
                        }}
                    />}
            </div>
        </>
    )
}
export default ProjectTitle