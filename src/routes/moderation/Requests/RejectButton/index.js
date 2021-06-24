import { useState } from "react";
import matrixcs from "matrix-js-sdk";
import { Loading } from "../../../../components/loading";

const knockClient = matrixcs.createClient({
    baseUrl: process.env.REACT_APP_MATRIX_BASE_URL,
    accessToken: process.env.REACT_APP_KNOCK_BOT_TOKEN,
    userId: process.env.REACT_APP_KNOCK_BOT_ACCOUNT,
    useAuthorizationHeader: true
})

const RejectButton = ({ eventId, roomId }) => {
    const [rejected, setRejected] = useState(false);
    const [loading, setLoading] = useState(false);

    const redact = (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            knockClient.redactEvent(roomId, eventId).then(console.log)
            setRejected(true)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }
    return <button disabled={rejected} onClick={(e) => redact(e)}>{loading ? <Loading /> : "REJECT"}</button>

}

export default RejectButton