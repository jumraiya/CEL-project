import {useState} from 'react';
import Dialog from "@mui/material/Dialog";
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import {Alert, Checkbox, FormControl, Box, FormControlLabel, Select, MenuItem, InputLabel, Stack} from "@mui/material";
import {TimePicker, DateTimePicker} from "@mui/x-date-pickers";
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import api from "./api.js";


function DaysOfWeek({setField, eventData}) {
    return (
        <Box sx={{display: eventData.recurring ? 'flex' : 'none', flexDirection: 'column', ml: 3}}>
            <FormControlLabel
                label="Sunday"
                control={<Checkbox
                    onChange={(event) => setField('recur_sun', event.target.checked)}
                    checked={eventData.recur_sun === true}
                />}
            />
            <FormControlLabel
                label="Monday"
                control={<Checkbox onChange={(event) => setField('recur_mon', event.target.checked)}
                                   checked={eventData.recur_mon === true}
                />}
            />
            <FormControlLabel
                label="Tuesday"
                control={<Checkbox onChange={(event) => setField('recur_tue', event.target.checked)}
                                   checked={eventData.recur_tue === true}
                />}
            />
            <FormControlLabel
                label="Wednesday"
                control={<Checkbox onChange={(event) => setField('recur_wed', event.target.checked)}
                                   checked={eventData.recur_wed === true}
                />}
            />
            <FormControlLabel
                label="Thursday"
                control={<Checkbox onChange={(event) => setField('recur_thu', event.target.checked)}
                                   checked={eventData.recur_thu === true}
                />}
            />
            <FormControlLabel
                label="Friday"
                control={<Checkbox onChange={(event) => setField('recur_fri', event.target.checked)}
                                   checked={eventData.recur_fri === true}
                />}
            />
            <FormControlLabel
                label="Saturday"
                control={<Checkbox onChange={(event) => setField('recur_sat', event.target.checked)}
                                   checked={eventData.recur_sat === true}
                />}
            />
        </Box>
    )
}

function RecurringEventTimes({show, eventData, setField}) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{display: show ? 'flex' : 'none'}}>
                <TimePicker
                    label="Start time"
                    sx ={{'backgroundColor': 'white'}}
                    value={eventData.recur_start}
                    onChange={(newValue) => setField('recur_start', newValue)}
                />
                <TimePicker
                    label="End time"
                    value={eventData.recur_end}
                    onChange={(newValue) => setField('recur_end', newValue)}
                />

            </Box>
        </LocalizationProvider>
    )
}

function EventDateTimes({show, eventData, setField}) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{display: show ? 'flex' : 'none'}}>
                <FormControl required={!eventData.recurring}>
                    <DateTimePicker
                        label="Start time"
                        views={['year', 'day', 'hours', 'minutes']}
                        value={eventData.start}
                        onChange={(newValue) => setField('start', newValue)}
                    />
                </FormControl>
                <FormControl required={!eventData.recurring}>
                    <DateTimePicker
                        label="End time"
                        views={['year', 'day', 'hours', 'minutes']}
                        value={eventData.end}
                        onChange={(newValue) => setField('end', newValue)}
                    />
                </FormControl>
            </Box>
        </LocalizationProvider>
    )
}

function FieldErrors({serverErrors, initialized, data}) {
    let errors = [];
    if (data.title === '' || data.title == null) {
        errors.push('Title is required');
    }
    if (data.timezone === '' || data.timezone == null) {
        errors.push('Time Zone is required');
    }
    if (data.recurring && data.recurring_days.length === 0) {
        errors.push('Please select at least one day of the week');
    }
    if (data.start === undefined ||  data.start === null || data.end === null || data.end === undefined) {
        errors.push('Start and end times are required');
    }
    errors = [...errors, ...serverErrors];
    const alerts = errors.map((e) => <Alert key={e} severity='error'> {e} </Alert>);
    return (
        <Stack sx={{display: initialized? 'block' : 'none' }} spacing={2}>
            {alerts}
        </Stack>
    )
}

function TimeZonePicker({setField}) {
    const timezones = [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles'
    ].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>);
    return (
        <>
            <InputLabel>Time Zone: </InputLabel>
            <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                variant="standard"
                required={true}
                label="Time Zone"
                defaultValue="America/Los_Angeles"
                onChange={(e) => {
                    setField('timeZone', e.target.value);
                }}>
                {timezones}
            </Select>
        </>
    )
}

function EventForm({open, handleClose, fetchEvents, timeZone}) {
    const [eventData, setEventData] = useState({
        title: '',
        recurring: false,
        recurring_days: [],
        start: null,
        end: null,
        recur_start: null,
        recur_end: null
    });
    const [showAlerts, setShowAlerts] = useState(false);
    const [lastPayload, setLastPayload] = useState({});
    const [serverErrors, setServerErrors] = useState([]);

    function setField(field, val) {
        setEventData((data) => {
            return {
                ...data, [field]: val
            }
        })
    }

    function closeForm() {
        setShowAlerts(false);
        handleClose();
    }

    function handleSubmit(e) {
        e.preventDefault();
        const days = ['recur_mon', 'recur_tue', 'recur_wed', 'recur_thu', 'recur_fri', 'recur_sat', 'recur_sun']
            .map((f, idx) => {
                if (eventData[f] === true)
                    return idx;
                else
                    return -1;
            })
            .filter((v) => v !== -1);
        const startTime = eventData.recurring?
            (eventData.recur_start && eventData.recur_start.format('YYYY-MM-DD HH:mm:ss')) :
            (eventData.start && eventData.start.format('YYYY-MM-DD HH:mm:ss'))
        const endTime = eventData.recurring?
            (eventData.recur_end && eventData.recur_end.format('YYYY-MM-DD HH:mm:ss')) :
            (eventData.end && eventData.end.format('YYYY-MM-DD HH:mm:ss'))
        console.log(eventData);
        const payload = {
            title: eventData.title,
            recurring_days: days,
            recurring: eventData.recurring,
            timezone: timeZone,
            start: startTime,
            end: endTime
        }
        console.log(payload);
        api.post('/event/', payload)
            .then(function (response) {
                fetchEvents();
                closeForm();
            })
            .catch(function (error) {
                if (error.response && error.response.data && error.response.data.error) {
                    setServerErrors([error.response.data.error]);
                } else {
                    setServerErrors(['An unexpected error occurred']);
                }
            });
        setLastPayload(payload);
        setShowAlerts(true);
    }



    return (
        <>
            <Dialog open={open} onClose={closeForm}>
                <DialogTitle>Create Event</DialogTitle>
                <DialogContent>
                    <FieldErrors serverErrors={serverErrors} initialized={showAlerts} data={lastPayload}></FieldErrors>
                    <TextField
                        autoFocus
                        required={true}
                        margin="dense"
                        id="title"
                        name="title"
                        label="Title"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={eventData.title}
                        onChange={(e) => setField('title', e.target.value)}
                    />
                    <div>
                        <FormControlLabel control={
                            <Checkbox name="recurring"
                                      id="recurring"
                                      value={eventData.recurring}
                                      checked={eventData.recurring}
                                      onChange={(e) => {
                                          setField('recurring', e.target.checked);
                                      }}/>}
                                          label="Recurring Event?"/>
                        <DaysOfWeek eventData={eventData} setField={setField}/>
                        <RecurringEventTimes show={eventData.recurring === true} eventData={eventData}
                                             setField={setField}></RecurringEventTimes>
                    </div>
                    <EventDateTimes show={eventData.recurring !== true} eventData={eventData}
                                    setField={setField}></EventDateTimes>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeForm}>Cancel</Button>
                    <Button onClick={handleSubmit} type="submit">Submit</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default EventForm