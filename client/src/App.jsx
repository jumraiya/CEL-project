import {useEffect, useState} from 'react'
import './App.css'
import EventList from "./EventList.jsx";
import EventForm from "./EventForm.jsx";
import {Button, Stack} from "@mui/material";
import api from "./api.js";

function App() {
    const [formOpen, setFormOpen] = useState(false)
    const [events, setEvents] = useState([])

    function fetchEvents() {
        api.get('/event')
            .then(function (response) {
                setEvents(response.data[0]);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    useEffect(() => {
        fetchEvents()
    }, [])
    return (
        <Stack spacing={2}>
            <h1>Event Manager</h1>
            <Button variant="contained" onClick={() => setFormOpen(true)}>Add Event</Button>
            <EventForm timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone} open={formOpen} fetchEvents={fetchEvents} handleClose={() => setFormOpen(false)}></EventForm>
            <EventList events={events} fetchEvents={fetchEvents} />
        </Stack>
    )
}

export default App
