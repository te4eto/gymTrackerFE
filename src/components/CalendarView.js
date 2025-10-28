// src/components/CalendarView.js
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { Button, ButtonGroup, IconButton } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month'); // Default view
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    axios.get('http://localhost:8080/api/sessions')
      .then(res => {
        const sessions = res.data.data || [];
        const calendarEvents = sessions.map(session => ({
          title: session.type || 'Workout',
          start: moment(session.date).toDate(),
          end: moment(session.date).toDate(),
          allDay: true
        }));
        setEvents(calendarEvents);
      })
      .catch(err => console.error('Error fetching sessions:', err));
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleNavigate = (action) => {
    const newDate = moment(date);
    if (action === 'prev') newDate.subtract(1, 'month');
    else if (action === 'next') newDate.add(1, 'month');
    setDate(newDate.toDate());
  };

  const handleSelectSlot = (slotInfo) => {
    const selectedDate = moment(slotInfo.start).format('YYYY-MM-DD');
    window.location.href = `/session/${selectedDate}`;
  };

  const handleSelectEvent = (event) => {
    const selectedDate = moment(event.start).format('YYYY-MM-DD');
    window.location.href = `/session/${selectedDate}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => handleNavigate('prev')}><ArrowBackIosIcon /></IconButton>
        <ButtonGroup variant="outlined">
          <Button onClick={() => handleViewChange('day')} color={view === 'day' ? 'primary' : 'inherit'}>Day</Button>
          <Button onClick={() => handleViewChange('week')} color={view === 'week' ? 'primary' : 'inherit'}>Week</Button>
          <Button onClick={() => handleViewChange('month')} color={view === 'month' ? 'primary' : 'inherit'}>Month</Button>
        </ButtonGroup>
        <IconButton onClick={() => handleNavigate('next')}><ArrowForwardIosIcon /></IconButton>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        date={date}
        onView={(newView) => setView(newView)}
        onNavigate={(newDate) => setDate(newDate)}
        onSelectSlot={handleSelectSlot} // Handle clicks on empty cells
        onSelectEvent={handleSelectEvent} // Handle clicks on events
        selectable={true} // Enable slot selection
        style={{ height: 500 }}
        components={{
          event: ({ event }) => (
            <div style={{ cursor: 'pointer' }}>
              {event.title}
            </div>
          )
        }}
      />
    </div>
  );
};

export default CalendarView;