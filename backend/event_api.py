from . import db
from flask import Blueprint, g, jsonify, request, Response
from datetime import datetime, timezone
import pytz, re

bp = Blueprint('event_api', __name__, url_prefix='/event')

@bp.route('/', methods=['GET'])
def get_events():
    conn = db.get_db()
    posts = conn.execute('SELECT * FROM event')
    data = posts.fetchall()
    return jsonify(data, 200, 'application/json')


def mk_error_response(error):
    return jsonify({'error': error}), 400

# Converts a given date time string in a given timezone to utc local datetime
def to_utc_datetime(timezone, datetime_string):
    local = pytz.timezone(timezone)
    start = datetime.strptime(datetime_string, "%Y-%m-%d %H:%M:%S")
    local_dt = local.localize(start, is_dst=None)
    return local_dt.astimezone(pytz.utc)

# When creating a new non-recurring event, check for conflicts with existing non-recurring events
def check_non_recurring_conflict(conn, start_date_time, end_date_time):
    event = conn.execute('SELECT title from event WHERE recurring=0 AND ((start_datetime < ? and end_datetime > ?) OR (start_datetime < ? and end_datetime > ?))',
                        [start_date_time, start_date_time, end_date_time, end_date_time]).fetchone()
    if event is not None:
        return mk_error_response('Event date time conflicts with an existing event {}'.format(event['title']))

# Returns timestamp for only the time portion of a date time
def get_time_timestamp(date_time):
    return date_time.time().hour * 3600 + date_time.time().minute * 60 + date_time.time().second

def get_utc_times(timezone, start, end):
    start_datetime = to_utc_datetime(timezone, start)
    end_datetime = to_utc_datetime(timezone, end)
    return [get_time_timestamp(start_datetime), get_time_timestamp(end_datetime)]

def check_required_fields(fields, input):
    missing = []
    for f in fields:
        if f not in input:
            missing.append(f)
    if len(missing) > 0:
        return mk_error_response(', '.join(missing) + ' are required')

# Helper function to add a where clause which matches events overlapping with a given start, end time
def add_time_overlap_clause(stmt, params, start_time, end_time):
    clause = ' AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time > ? AND end_time < ?))'
    values = params + [start_time, start_time, end_time, end_time, start_time, end_time]
    return stmt + clause,values

# When creating a new recurring event, checks for conflicts with existing non-recurring events in the future
def check_recurring_non_recurring_conflict(conn, recurring_days_set, recurring_start_time, recurring_end_time):
    now = int(datetime.now(timezone.utc).timestamp())
    (stmt, params) = add_time_overlap_clause('SELECT title, start_datetime, end_datetime FROM event WHERE recurring=0 AND start_datetime > ?',
                                             [now], recurring_start_time, recurring_end_time)
    non_recurring_events = conn.execute(stmt, params).fetchall()
    for event in non_recurring_events:
        event_datetime = datetime.fromtimestamp(event['start_datetime'])
        if str(event_datetime.weekday()) in recurring_days_set:
            return mk_error_response('Event date time conflicts with an existing event {}'.format(event['title']))

# When creating a non-recurring event, checks for conflicts with existing recurring events
def check_non_recurring_recurring_conflict(conn, start_datetime, end_datetime, start_time, end_time):
    (stmt, params) = add_time_overlap_clause('SELECT title, recurring_days FROM event WHERE recurring=1', [], start_time, end_time)
    recurring_events = conn.execute(stmt, params).fetchall()
    for event in recurring_events:
        recurring_days_set = set(event['recurring_days'].split(','))
        if str(start_datetime.weekday()) in recurring_days_set or str(end_datetime.weekday()) in recurring_days_set:
            return mk_error_response('Event date time conflicts with an existing event {}'.format(event['title']))

def check_date_formats(post_input):
    pattern = '[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'
    test_1 = re.search(pattern, post_input['start'])
    test_2 = re.search(pattern, post_input['end'])

    if test_1 is None or test_1.string != post_input['start']:
        return mk_error_response('start date time is in incorrect format')
    if test_2 is None or test_2.string != post_input['end']:
        return mk_error_response('end date time is in incorrect format')

@bp.route('/', methods=['POST'])
def create_event():
    post_input = request.get_json()
    conn = db.get_db()

    error = check_required_fields(['title', 'timezone', 'start', 'end'], post_input)
    if error is not None:
        return error
    error = check_date_formats(post_input)
    if error is not None:
        return error

    if 'recurring' in post_input and post_input['recurring'] is True:
        error = check_required_fields(['recurring_days'], post_input)
        if error is not None:
            return error
        recurring_days = list(map(str, post_input['recurring_days']))
        (start_time, end_time) = get_utc_times(post_input['timezone'], post_input['start'], post_input['end'])

        if end_time <= start_time:
            return mk_error_response('Ending time cannot be before start time')

        (stmt, params) = add_time_overlap_clause('SELECT title,recurring_days,start_time,end_time FROM event WHERE recurring=1', [], start_time, end_time)
        existing_events = conn.execute(stmt, params).fetchall()
        recurring_days_set = set(recurring_days)
        for event in existing_events:
            days_set = set(event['recurring_days'].split(','))
            if len(days_set.intersection(recurring_days_set)) > 0:
                return mk_error_response('Event date time conflicts with an existing event {}'.format(event['title']))
        non_recurring_conflict = check_recurring_non_recurring_conflict(conn, recurring_days_set, start_time, end_time)
        if non_recurring_conflict is not None:
            return non_recurring_conflict

        stmt = 'INSERT INTO event(title, recurring, recurring_days, start_time, end_time) VALUES (?,?,?,?,?)'
        values = [post_input['title'], 1, ','.join(recurring_days), start_time, end_time]
    else:

        # Given a timezone and start,end date times we localize them to UTC before saving them in the database
        start_utc_dt = to_utc_datetime(post_input['timezone'], post_input['start'])
        end_utc_dt = to_utc_datetime(post_input['timezone'], post_input['end'])

        if end_utc_dt < start_utc_dt:
            return mk_error_response('Ending date time cannot be before start date time')

        start_time = get_time_timestamp(start_utc_dt)
        end_time = get_time_timestamp(end_utc_dt)

        error = check_non_recurring_conflict(conn, int(start_utc_dt.timestamp()), int(end_utc_dt.timestamp()))
        if error is None:
            error = check_non_recurring_recurring_conflict(conn, start_utc_dt, end_utc_dt, start_time, end_time)
        if error is not None:
            return error

        stmt = 'INSERT INTO event (title, start_datetime, end_datetime, start_time, end_time) VALUES(?,?,?,?,?)'
        values = [post_input['title'],
                  int(start_utc_dt.timestamp()),
                  int(end_utc_dt.timestamp()),
                  start_time,
                  end_time]

    conn.execute(stmt, values)
    conn.commit()
    return Response(status=200)

@bp.route('/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    conn = db.get_db()
    conn.execute('DELETE FROM event WHERE id=?', [int(event_id)])
    conn.commit()
    return Response(status=200)