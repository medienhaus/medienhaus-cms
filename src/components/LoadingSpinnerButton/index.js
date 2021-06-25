import { useState } from "react";
import { Loading } from "../loading";


const LoadingSpinnerButton = ({disabled, onClick: callback, children }) => {
    const [loading, setLoading] = useState(false);

    const onClick = async (e) => {
        e.preventDefault()
        setLoading(true)
        await callback()
        setLoading(false)
    }


    return <button disabled={disabled} onClick={onClick}>{loading ? <Loading /> : children}</button>

}

export default LoadingSpinnerButton