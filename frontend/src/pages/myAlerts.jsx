import React, {useEffect,useState} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const GetMyAlerts = () => {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("token");
    const [isSubmitting,setIsSubmitting] = useState(false);
    const [message,setMessage] = useState("");
    const [alerts,setAlerts]= useState([]);
    const getAlerts = async () => {
        try {
            setIsSubmitting(true);
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/alerts/me`, {headers: {Authorization : `Bearer ${token}`}});
            setAlerts(res.data.alerts || []);
        } catch (err) {
            if(err.response && err.response.data ) {
                setMessage(err.response.data.message)
            }
            else{
                setMessage("Something went wrong. Try again later");
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    useEffect( ()=>{
        if(! token) {
            navigate("/login");
            return ;
        }
        getAlerts();
    },[navigate, token]);

    
    
    return (
        <div>
            {alerts.length > 0 ? (
            <ul>
                {alerts.map((alert, index) => (
                    <li key={index}>
                        <p>You have a {alert.riskLevel} risk {alert.type} . please be cautious. expires:{alert.expiresAt}</p>
                    </li>
                ))}
            </ul>
            ):(<p>{isSubmitting? "processing" : message? message : "No active alerts"}</p>)}
        </div>
    )
}
export default GetMyAlerts;