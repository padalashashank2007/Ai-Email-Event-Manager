import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logoutApi } from "../services/authService";
import { linkCalendar, getCalendarEvents, unlinkCalendar, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "../services/calendarService";
import api from "../services/api";
import ProfilePopup from "../components/ProfilePopup";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import "./Home.css";

const localizer = momentLocalizer(moment);

function Home() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ title: '', start: '', end: '' });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (activeTab === 'Calendar' && user?.isCalendarLinked) {
      const fetchEvents = async () => {
        try {
          setLoadingCalendar(true);
          const res = await getCalendarEvents();
          setEvents(res.events || []);
        } catch (err) {
          console.error("Failed to fetch events", err);
        } finally {
          setLoadingCalendar(false);
        }
      };
      fetchEvents();
    }
  }, [activeTab, user?.isCalendarLinked]);

  const handleLinkCalendar = () => {
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID,
      scope: "openid email profile https://www.googleapis.com/auth/calendar",
      ux_mode: "popup",
      callback: async (response) => {
        try {
          if (response.code) {
            await linkCalendar(response.code);
            setUser({ ...user, isCalendarLinked: true });
            alert("Calendar linked successfully!");
          }
        } catch (err) {
          alert(
            err.response?.data?.message ||
            "Failed to link calendar."
          );
        }
      },
    });
    client.requestCode();
  };

  const handleUnlinkCalendar = async () => {
    if (window.confirm("Are you sure you want to unlink your Google Calendar?")) {
      try {
        await unlinkCalendar();
        setUser({ ...user, isCalendarLinked: false });
        setEvents([]); 
        alert("Calendar unlinked successfully.");
      } catch (err) {
        alert(err.response?.data?.message || "Failed to unlink calendar.");
      }
    }
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setEventForm({ title: '', start: moment().format('YYYY-MM-DDTHH:mm'), end: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm') });
    setShowEventModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      start: moment(event.start).format('YYYY-MM-DDTHH:mm'),
      end: moment(event.end).format('YYYY-MM-DDTHH:mm')
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, eventForm);
        alert("Event updated!");
      } else {
        await addCalendarEvent(eventForm);
        alert("Event added!");
      }
      setShowEventModal(false);
      setLoadingCalendar(true);
      const res = await getCalendarEvents();
      setEvents(res.events || []);
      setLoadingCalendar(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save event");
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent || !window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteCalendarEvent(editingEvent.id);
      alert("Event deleted!");
      setShowEventModal(false);
      setLoadingCalendar(true);
      const res = await getCalendarEvents();
      setEvents(res.events || []);
      setLoadingCalendar(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi(); 
    } catch (err) {
      console.error(err);
    } finally {
      logout();
      navigate("/");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Navigation Bar */}
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <svg className="brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span className="brand-title">Dashboard</span>
        </div>

        <div className="navbar-links">
          <button 
            className={`nav-link ${activeTab === 'Home' ? 'active' : ''}`}
            onClick={() => setActiveTab('Home')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Home
          </button>
          <button 
            className={`nav-link ${activeTab === 'Calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('Calendar')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Calendar
          </button>
        </div>

        <div className="navbar-profile" style={{ position: 'relative' }}>
          <button className="profile-btn" onClick={() => setShowProfileMenu(true)}>
            <div className="profile-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span className="profile-name">My Info</span>
          </button>

          {showProfileMenu && (
            <ProfilePopup onClose={() => setShowProfileMenu(false)} />
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-content">
        <header className="content-header">
          <h1>{activeTab === 'Home' ? 'Welcome Back!' : 'Your Calendar'}</h1>
          <p className="subtitle">
            {activeTab === 'Home' 
              ? 'Here is an overview of your events and tasks today.' 
              : 'Manage your schedule and upcoming meetings.'}
          </p>
        </header>

        <div className="content-body">
          {activeTab === 'Home' ? (
            <div className="dashboard-cards">
              <div className="dash-card">
                <h3>Integrations</h3>
                {user?.isCalendarLinked ? (
                  <div className="calendar-status" style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'green'}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <span>Calendar is Linked</span>
                    </div>
                    <button onClick={handleUnlinkCalendar} style={{
                      padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: 'fit-content', fontSize: '13px'
                    }}>
                      Unlink
                    </button>
                  </div>
                ) : (
                  <div style={{marginTop: '10px'}}>
                    <p style={{fontSize: '0.9em', color: '#666', marginBottom: '10px'}}>Link your Google Calendar to sync events.</p>
                    <button onClick={handleLinkCalendar} style={{
                      padding: '8px 16px', backgroundColor: '#4285f4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                    }}>
                      Link Calendar
                    </button>
                  </div>
                )}
              </div>
              <div className="dash-card">
                <h3>Upcoming Events</h3>
                <div className="card-placeholder">Check your Calendar tab</div>
              </div>
              <div className="dash-card">
                <h3>Recent Emails</h3>
                <div className="card-placeholder">No recent emails</div>
              </div>
              <div className="dash-card">
                <h3>AI Insights</h3>
                <div className="card-placeholder">Everything looks good!</div>
              </div>
            </div>
          ) : (
            <div className="calendar-view">
              {!user?.isCalendarLinked ? (
                <div className="calendar-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <p>Please link your Google Calendar</p>
                  <button onClick={handleLinkCalendar} style={{
                    padding: '8px 16px', backgroundColor: '#4285f4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold'
                  }}>
                    Link Calendar
                  </button>
                </div>
              ) : (
                <div className="events-list" style={{padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '700px', display: 'flex', flexDirection: 'column', position: 'relative'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2>Your Calendar</h2>
                    <button onClick={openAddModal} style={{
                      padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                    }}>
                      + Add Event
                    </button>
                  </div>

                  {loadingCalendar ? (
                    <div style={{marginTop: '20px', color: '#666'}}>Loading your calendar...</div>
                  ) : (
                    <div style={{flex: 1, marginTop: '15px'}}>
                      <Calendar
                        localizer={localizer}
                        events={events.map(e => ({
                          id: e.id,
                          title: e.summary || '(No title)',
                          start: new Date(e.start.dateTime || e.start.date),
                          end: new Date(e.end.dateTime || e.end.date || e.start.dateTime || e.start.date),
                          allDay: !!e.start.date
                        }))}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%', minHeight: '500px' }}
                        views={['month', 'week', 'day', 'agenda']}
                        defaultView="month"
                        date={calendarDate}
                        onNavigate={(newDate) => setCalendarDate(newDate)}
                        onSelectEvent={(event) => openEditModal(event)}
                      />
                    </div>
                  )}

                  {showEventModal && (
                    <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                      <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', minWidth: '400px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                          <h3 style={{margin: 0}}>{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
                          <button type="button" onClick={() => setShowEventModal(false)} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer', lineHeight: '1'}}>&times;</button>
                        </div>
                        <form onSubmit={handleSaveEvent} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Event Title</label>
                            <input type="text" required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}} />
                          </div>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Start Time</label>
                            <input type="datetime-local" required value={eventForm.start} onChange={e => setEventForm({...eventForm, start: e.target.value})} style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}} />
                          </div>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>End Time</label>
                            <input type="datetime-local" required value={eventForm.end} onChange={e => setEventForm({...eventForm, end: e.target.value})} style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}} />
                          </div>
                          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px'}}>
                            {editingEvent && (
                              <button type="button" onClick={handleDeleteEvent} style={{padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                                Delete
                              </button>
                            )}
                            <button type="submit" style={{padding: '8px 16px', backgroundColor: '#4285f4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                              {editingEvent ? 'Save Changes' : 'Add Event'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;
