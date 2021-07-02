import React, { useEffect, useState } from "react"
import LoadingSpinnerButton from "../LoadingSpinnerButton"


const PublishProject = ({ projectSpace, published }) => {
    const [response, setResponse] = useState()
    const [visibility, setVisibility] = useState(published);
    const [consent, setConsent] = useState(false);


    useEffect(() => {
        setVisibility(published)
    }, [published]);

    const onChangeVisibility = async () => {
        const req = {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
            body: JSON.stringify({ join_rule: visibility === 'public' ? 'public' : 'invite' })
        }
        try {
            // matrixClient.sendEvent(projectSpace, "m.room.join_rules", {"join_rule": visibility === "public" ? 'public' : 'invite'} ).then((res) => console.log(res))
            fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.room.join_rules/`, req)
                .then(response => {
                    console.log(response)
                    if (response.ok) {
                        setResponse('Changed successfully!')
                        setTimeout(() => {
                            setResponse()
                        }, 3000)
                    } else {
                        setResponse('Oh no, something went wrong.')
                        setTimeout(() => {
                            setResponse()
                        }, 3000)
                    }
                })
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div>
            <div>
                <select name="visibility" id="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                    <option value="public">Public</option>
                    <option value="invite">Draft</option>
                </select>
            </div>
            <div>
                <LoadingSpinnerButton disabled={!consent} onClick={onChangeVisibility}>SAVE</LoadingSpinnerButton>
                {response && <p>{response}</p>}
                <div>
                    <label htmlFor="checkbox">I hereby consent</label>
                    <input id="checkbox" name="checkbox" type="checkbox" value={consent} onChange={() => setConsent(consent => !consent)} />
                </div>
            </div>
        </div>

    )
}

export default PublishProject