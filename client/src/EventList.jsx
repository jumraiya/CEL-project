import {useEffect, useState} from "react"
import api from './api'
import {Stack, Button} from "@mui/material"
import Grid from "@mui/material/Grid2"
import Paper from "@mui/material/Paper"


function EventItem({data, fetchEvents}) {
    function mkDateTime(ts) {
        const d = new Date(ts * 1000);
        return d.toLocaleString('en-US', {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric"
        });
    }

    function mkTime(ts) {
        const today = new Date();
        const utcTimeStamp = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) + ts * 1000;
        return new Date(utcTimeStamp).toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric'});
    }

    function deleteEvent(id) {
        api.delete('/event/' + id)
            .then((response) => {
                fetchEvents();
            })
            .catch((error) => {
                console.log(error);
            });
    }

    const dayMap = {
        '0': 'Monday',
        '1': 'Tuesday',
        '2': 'Wednesday',
        '3': 'Thursday',
        '4': 'Friday',
        '5': 'Saturday',
        '6': 'Sunday'
    }

    const start = data.recurring == 1 ? mkTime(data.start_time) : mkDateTime(data.start_datetime);
    const end = data.recurring == 1 ? mkTime(data.end_time) : mkDateTime(data.end_datetime);
    const recurString = data.recurring == 1 ?
        " (Recurs every " + data.recurring_days.split(",").map((d) => dayMap[d]).join(", ") + ')' :
        '';
    return (
        <Paper sx={{paddingTop: '20px', paddingBottom: '20px'}} elevation={2}>
            <Grid container spacing={2}>
                <Grid size={6}>{data.title}{recurString}</Grid>
                <Grid>
                    <Stack>
                        <div><b>Starts: </b> {start}</div>
                        <div><b>Ends: </b> {end}</div>
                    </Stack>
                </Grid>
                <Grid><Button size="small" onClick={() => deleteEvent(data.id)} variant="outlined"
                              color="error">Delete</Button></Grid>
            </Grid>
        </Paper>
    )
}

function EventList({events, fetchEvents}) {
    const eventList = events.map((e) => <EventItem fetchEvents={fetchEvents} key={e.id} data={e}></EventItem>)
    return (
        <Stack spacing={2}>
            {eventList}
        </Stack>
    )
}

export default EventList