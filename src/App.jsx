import { useCallback, useEffect, useMemo, useState } from "react";
import "./index.css";

const API = import.meta.env.PROD ? "" : "http://localhost:5000";
const USER_ID = 1;

const blankTrip = {
  title: "",
  destination: "",
  start_date: "",
  end_date: "",
  description: "",
};

const blankActivity = {
  title: "",
  activity_date: "",
  activity_time: "",
  location: "",
  notes: "",
};

const QUOTES = [
  "Pack light. Leave room for the detour.",
  "The best part of the map is the bit you didn't plan.",
  "Get lost on purpose, at least once a trip.",
  "Say yes to the street you can't pronounce.",
  "A good trip is mostly good mornings in unfamiliar places.",
  "Take the window seat. Watch the world rearrange itself.",
  "Eat where the menu is handwritten.",
  "Some memories only fit in a carry-on.",
  "Plans are a polite way of asking the day to surprise you.",
  "Your passport has room for more stories than stamps.",
  "Slow down. The view isn't going anywhere, but you are.",
  "Every strange town is a story waiting for you to walk in.",
];

/* ---------- helpers ---------- */

function dateInput(value) {
  return value ? String(value).slice(0, 10) : "";
}

function toDate(value) {
  return new Date(`${dateInput(value)}T12:00:00`);
}

function prettyDate(value) {
  if (!value) return "Date to be decided";
  return toDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDate(value) {
  if (!value) return "TBD";
  return toDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function tripLength(trip) {
  if (!trip.start_date || !trip.end_date) return null;
  const diff = toDate(trip.end_date) - toDate(trip.start_date);
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

// Airport-style code, e.g. "Bali" -> "BAL", "New York" -> "NYO".
function tripCode(destination = "") {
  const words = destination.replace(/[^A-Za-z\s]/g, "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "TRP";
  const letters =
    words.length === 1
      ? words[0]
      : words.map((word) => word[0]).join("") + words[0].slice(1);
  return letters.slice(0, 3).toUpperCase();
}

function getTone(index) {
  return ["sun", "blush", "sky", "tangerine"][index % 4];
}

function dayHeading(dateStr) {
  return toDate(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dayNumber(dateStr, trip) {
  if (!trip?.start_date) return null;
  const n = Math.round((toDate(dateStr) - toDate(trip.start_date)) / 86400000) + 1;
  return n >= 1 ? `Day ${n}` : null;
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.error || data.message || message;
    } catch {
      // The server did not return JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

/* ---------- small components ---------- */

const ICONS = {
  plus: "M12 5v14M5 12h14",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  close: "M6 6l12 12M18 6L6 18",
  calendar: "M5 5h14v15H5zM5 10h14M9 3v4M15 3v4",
  plane: "M21 3L3 10.5l7 2.5 2.5 7L21 3zM10 13l11-10",
  shuffle: "M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
};

function Icon({ name, size = 16 }) {
  return (
    <svg
      className={`icon icon-${name}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

function Button({ children, variant = "dark", className = "", ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Stamp() {
  const across = [5, 15, 25, 35, 45, 55, 65];
  const down = [7, 17, 27, 37, 47, 57, 67, 77];
  return (
    <svg className="stamp" viewBox="0 0 70 84" aria-hidden="true">
      <defs>
        <mask id="stamp-mask">
          <rect width="70" height="84" fill="#fff" />
          {across.map((x) => (
            <circle key={`t${x}`} cx={x} cy="0" r="3.4" fill="#000" />
          ))}
          {across.map((x) => (
            <circle key={`b${x}`} cx={x} cy="84" r="3.4" fill="#000" />
          ))}
          {down.map((y) => (
            <circle key={`l${y}`} cx="0" cy={y} r="3.4" fill="#000" />
          ))}
          {down.map((y) => (
            <circle key={`r${y}`} cx="70" cy={y} r="3.4" fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask="url(#stamp-mask)">
        <rect width="70" height="84" fill="#ffd23f" />
        <rect x="7" y="7" width="56" height="70" fill="#fff6cf" stroke="#1a1f4a" strokeWidth="1.5" />
        <circle cx="35" cy="33" r="12" fill="#ee4a2f" />
        <path
          d="M12 58 q7 -8 14 0 t14 0 t14 0"
          fill="none"
          stroke="#2744b8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text x="35" y="71" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#1a1f4a">
          AIR MAIL
        </text>
      </g>
    </svg>
  );
}

function Postmark() {
  const now = new Date();
  const day = now
    .toLocaleDateString("en-US", { day: "2-digit", month: "short" })
    .toUpperCase();
  return (
    <svg className="postmark" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id="pm-arc" d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0" />
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text fontSize="8" fontWeight="800" fill="currentColor">
        <textPath href="#pm-arc" textLength="220" lengthAdjust="spacing">
          TRIPLY POST OFFICE • AIR MAIL •
        </textPath>
      </text>
      <text x="50" y="49" textAnchor="middle" fontSize="12" fontWeight="800" fill="currentColor">
        {day}
      </text>
      <text x="50" y="63" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
        {now.getFullYear()}
      </text>
    </svg>
  );
}

/* ---------- app ---------- */

function App() {
  const [trips, setTrips] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tripForm, setTripForm] = useState(blankTrip);
  const [activityForm, setActivityForm] = useState(blankActivity);
  const [editingId, setEditingId] = useState(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [quote, setQuote] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const selectedTrip = trips.find(
    (trip) => String(trip.id) === String(selectedId)
  );

  const loadTrips = useCallback(async () => {
    try {
      setError("");
      const data = await request("/api/trips");
      const list = Array.isArray(data) ? data : [];
      setTrips(list);

      setSelectedId((current) => {
        if (list.some((trip) => String(trip.id) === String(current))) {
          return current;
        }
        return list.length ? list[0].id : null;
      });
    } catch (err) {
      setError(
        `${err.message}. Check that your backend is running on port 5000.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivities = useCallback(async (tripId) => {
    if (!tripId) {
      setActivities([]);
      return;
    }

    setActivityLoading(true);
    try {
      const data = await request(`/api/trips/${tripId}/activities`);
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setActivities([]);
      setError(`Could not load activities: ${err.message}`);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    if (selectedId != null) {
      loadActivities(selectedId);
    } else {
      setActivities([]);
    }
  }, [selectedId, loadActivities]);

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  // A fresh postcard every few seconds; clicking the button resets the timer.
  useEffect(() => {
    const timer = setTimeout(
      () => setQuote((q) => (q + 1) % QUOTES.length),
      11000
    );
    return () => clearTimeout(timer);
  }, [quote]);

  // Close dialogs with Escape.
  const modalOpen = showTripForm || showActivityForm;
  useEffect(() => {
    if (!modalOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const filteredTrips = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return trips;
    return trips.filter((trip) =>
      [trip.title, trip.destination, trip.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [trips, search]);

  const totalDays = trips.reduce(
    (sum, trip) => sum + (tripLength(trip) || 0),
    0
  );

  const groupedActivities = useMemo(() => {
    const key = (a) => `${dateInput(a.activity_date)} ${a.activity_time || "99:99"}`;
    const sorted = [...activities].sort((a, b) => key(a).localeCompare(key(b)));
    const map = new Map();
    sorted.forEach((activity) => {
      const day = dateInput(activity.activity_date);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(activity);
    });
    return [...map.entries()];
  }, [activities]);

  function closeModal() {
    setShowTripForm(false);
    setShowActivityForm(false);
  }

  function openCreateTrip() {
    setTripForm(blankTrip);
    setEditingId(null);
    setShowActivityForm(false);
    setShowTripForm(true);
    setError("");
  }

  function openEditTrip(trip) {
    setTripForm({
      title: trip.title || "",
      destination: trip.destination || "",
      start_date: dateInput(trip.start_date),
      end_date: dateInput(trip.end_date),
      description: trip.description || "",
    });
    setEditingId(trip.id);
    setShowActivityForm(false);
    setShowTripForm(true);
    setError("");
  }

  function openAddActivity() {
    if (!selectedTrip) return;
    setActivityForm({
      ...blankActivity,
      activity_date: dateInput(selectedTrip.start_date),
    });
    setShowTripForm(false);
    setShowActivityForm(true);
    setError("");
  }

  async function saveTrip(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const editing = editingId != null;
      const result = await request(
        editing ? `/api/trips/${editingId}` : "/api/trips",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(
            editing ? tripForm : { ...tripForm, user_id: USER_ID }
          ),
        }
      );

      if (editing) {
        setTrips((current) =>
          current.map((trip) =>
            String(trip.id) === String(editingId)
              ? { ...trip, ...result }
              : trip
          )
        );
        setNotice("Trip updated");
      } else {
        setTrips((current) => [...current, result]);
        setSelectedId(result.id);
        setNotice("Trip created");
      }

      setShowTripForm(false);
      setEditingId(null);
      setTripForm(blankTrip);
      await loadTrips();
    } catch (err) {
      setError(`Couldn't save the trip: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTrip(trip) {
    if (
      !window.confirm(
        `Delete "${trip.title}"? Its linked activities may also be deleted.`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await request(`/api/trips/${trip.id}`, { method: "DELETE" });
      const remaining = trips.filter(
        (item) => String(item.id) !== String(trip.id)
      );
      setTrips(remaining);
      if (String(selectedId) === String(trip.id)) {
        setSelectedId(remaining.length ? remaining[0].id : null);
      }
      setNotice("Trip deleted");
      await loadTrips();
    } catch (err) {
      setError(`Couldn't delete the trip: ${err.message}`);
    }
  }

  async function saveActivity(event) {
    event.preventDefault();
    if (!selectedTrip) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await request(`/api/trips/${selectedTrip.id}/activities`, {
        method: "POST",
        body: JSON.stringify(activityForm),
      });

      setActivityForm(blankActivity);
      setShowActivityForm(false);
      await loadActivities(selectedTrip.id);
      setNotice("Activity added");
    } catch (err) {
      setError(`Couldn't add the activity: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  const nextStop = selectedTrip?.destination || trips[0]?.destination || "somewhere good";

  return (
    <>
      <div className="stripe-top" aria-hidden="true" />
      <div className="app">
        <header className="top">
          <a className="brand" href="#top" aria-label="Triply home">
            <span className="brand-plane">
              <Icon name="plane" size={18} />
            </span>
            triply
          </a>
          <Button onClick={openCreateTrip}>
            <Icon name="plus" /> New trip
          </Button>
        </header>

        <section className="hero" id="top">
          <div className="hero-copy">
            <h1>
              <span className="line"><span>Pack the bag.</span></span>
              <span className="line"><span>Plan the days.</span></span>
            </h1>
            <p className="hero-line">
              <mark>{trips.length}</mark> {trips.length === 1 ? "trip" : "trips"} on the board,{" "}
              <mark>{totalDays}</mark> {totalDays === 1 ? "day" : "days"} to look forward to
              {selectedTrip && (
                <>
                  {" "}and <mark>{activities.length}</mark>{" "}
                  {activities.length === 1 ? "thing" : "things"} planned in {selectedTrip.destination}
                </>
              )}
              .
            </p>
            <Button onClick={openCreateTrip}>
              <Icon name="plus" /> Plan a trip
            </Button>
          </div>

          <div className="postcard-wrap">
            <div className="pile">
              <article className="postcard" key={quote} aria-live="polite">
                <div className="pc-note">
                  <blockquote>“{QUOTES[quote]}”</blockquote>
                  <span className="pc-sign">your future self</span>
                </div>
                <div className="pc-side">
                  <div className="pc-stamp">
                    <Stamp />
                  </div>
                  <Postmark />
                  <div className="pc-line">To: you</div>
                  <div className="pc-line">Next stop: {nextStop}</div>
                  <div className="pc-line" />
                </div>
              </article>
            </div>
            <div className="postcard-actions">
              <Button
                variant="soft"
                onClick={() => setQuote((q) => (q + 1) % QUOTES.length)}
              >
                <Icon name="shuffle" /> Another postcard
              </Button>
            </div>
          </div>
        </section>

        {error && (
          <div className="banner" role="alert">
            <p>{error}</p>
            <button className="round-btn" onClick={() => setError("")} aria-label="Dismiss error">
              <Icon name="close" size={14} />
            </button>
          </div>
        )}

        <div className="workspace">
          {/* ---------- trips ---------- */}
          <section aria-label="Your trips">
            <div className="panel-title">
              <h2>Your trips</h2>
              {!loading && <span className="count">{filteredTrips.length}</span>}
            </div>

            <label className="search">
              <Icon name="search" size={18} />
              <input
                type="search"
                placeholder="Search by name or place"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search trips"
              />
            </label>

            {loading ? (
              <div className="trip-list">
                {[1, 2, 3].map((item) => (
                  <div className="skeleton" key={item} />
                ))}
              </div>
            ) : filteredTrips.length === 0 ? (
              search ? (
                <div className="empty">
                  <h3>No matches</h3>
                  <p>Nothing matches “{search}”. Try a different name or place.</p>
                  <Button variant="soft" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="empty">
                  <span className="empty-icon">
                    <Icon name="plane" size={26} />
                  </span>
                  <h3>No trips yet</h3>
                  <p>Create your first trip to start planning days and activities.</p>
                  <Button onClick={openCreateTrip}>
                    <Icon name="plus" /> Create a trip
                  </Button>
                </div>
              )
            ) : (
              <div className="trip-list">
                {filteredTrips.map((trip) => {
                  const isActive = String(selectedId) === String(trip.id);
                  const days = tripLength(trip);
                  const tone = getTone(trips.indexOf(trip));

                  return (
                    <div
                      className={`ticket tone-${tone} ${isActive ? "is-active" : ""}`}
                      key={trip.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      onClick={() => setSelectedId(trip.id)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(trip.id);
                        }
                      }}
                    >
                      <div className="ticket-main">
                        <span className="ticket-code">{tripCode(trip.destination)}</span>
                        <div className="ticket-info">
                          <h3>{trip.title}</h3>
                          <p>
                            <Icon name="pin" size={13} /> {trip.destination}
                          </p>
                        </div>
                      </div>

                      <div className="ticket-stub">
                        <strong>{shortDate(trip.start_date)}</strong>
                        <span>{days ? `${days} ${days === 1 ? "day" : "days"}` : "dates tbd"}</span>
                      </div>

                      <div
                        className="ticket-actions"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          className="round-btn"
                          onClick={() => openEditTrip(trip)}
                          title="Edit trip"
                          aria-label={`Edit ${trip.title}`}
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          className="round-btn danger"
                          onClick={() => deleteTrip(trip)}
                          title="Delete trip"
                          aria-label={`Delete ${trip.title}`}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ---------- itinerary ---------- */}
          <section className="detail" aria-label="Itinerary">
            {!selectedTrip ? (
              <div className="empty-detail">
                <div className="empty">
                  <span className="empty-icon">
                    <Icon name="plane" size={26} />
                  </span>
                  <h3>Pick a trip</h3>
                  <p>Select a ticket on the left to see its itinerary, or create a new one.</p>
                  <Button variant="soft" onClick={openCreateTrip}>
                    <Icon name="plus" /> Create a trip
                  </Button>
                  <p className="empty-quote">“{QUOTES[(quote + 5) % QUOTES.length]}”</p>
                </div>
              </div>
            ) : (
              <>
                <div className="detail-head">
                  <div>
                    <h2>{selectedTrip.title}</h2>
                    <div className="detail-meta">
                      <span className="chip chip-blush">
                        <Icon name="pin" size={15} /> {selectedTrip.destination}
                      </span>
                      <span className="chip chip-yellow">
                        <Icon name="calendar" size={15} />
                        {prettyDate(selectedTrip.start_date)} to {prettyDate(selectedTrip.end_date)}
                      </span>
                    </div>
                  </div>
                  <Button onClick={openAddActivity}>
                    <Icon name="plus" /> Add activity
                  </Button>
                </div>

                {selectedTrip.description && (
                  <p className="detail-desc">{selectedTrip.description}</p>
                )}

                <div className="timeline" key={selectedTrip.id}>
                  {activityLoading ? (
                    <div className="mini-loading">Loading activities…</div>
                  ) : groupedActivities.length === 0 ? (
                    <div className="empty">
                      <span className="empty-icon">
                        <Icon name="pin" size={26} />
                      </span>
                      <h3>Nothing planned yet</h3>
                      <p>Add a café, a landmark or a detour. Activities are grouped by day.</p>
                      <Button variant="soft" onClick={openAddActivity}>
                        <Icon name="plus" /> Add the first activity
                      </Button>
                      <p className="empty-quote">“{QUOTES[(quote + 3) % QUOTES.length]}”</p>
                    </div>
                  ) : (
                    groupedActivities.map(([day, items], dayIndex) => {
                      const number = dayNumber(day, selectedTrip);
                      return (
                        <div
                          className="day"
                          key={day}
                          style={{ animationDelay: `${dayIndex * 90}ms` }}
                        >
                          <div className="day-tag">
                            {number && <strong>{number}</strong>}
                            <span>{dayHeading(day)}</span>
                          </div>

                          {items.map((activity) => (
                            <article className="entry" key={activity.id}>
                              <span
                                className={`entry-time ${activity.activity_time ? "" : "flex"}`}
                              >
                                {activity.activity_time
                                  ? String(activity.activity_time).slice(0, 5)
                                  : "Anytime"}
                              </span>
                              <div>
                                <h4>{activity.title}</h4>
                                <span className="entry-place">
                                  <Icon name="pin" size={13} />
                                  {activity.location || selectedTrip.destination}
                                </span>
                                {activity.notes && <p>{activity.notes}</p>}
                              </div>
                            </article>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {notice && (
        <div className="toast" role="status">
          <i />
          {notice}
        </div>
      )}

      {modalOpen && (
        <div
          className="backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-top">
              <h2 id="modal-title">
                {showTripForm
                  ? editingId
                    ? "Edit trip"
                    : "New trip"
                  : "Add activity"}
              </h2>
              <button
                className="round-btn close-btn"
                onClick={closeModal}
                aria-label="Close dialog"
              >
                <Icon name="close" size={14} />
              </button>
            </div>

            {showTripForm ? (
              <>
                <p className="modal-sub">
                  Name it, pick a place and set the dates. You can add activities after.
                </p>
                <form onSubmit={saveTrip} className="form">
                  <label>
                    Trip name
                    <input
                      required
                      autoFocus
                      maxLength={150}
                      placeholder="e.g. A week in Bali"
                      value={tripForm.title}
                      onChange={(event) =>
                        setTripForm({ ...tripForm, title: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Destination
                    <input
                      required
                      maxLength={200}
                      placeholder="City or country"
                      value={tripForm.destination}
                      onChange={(event) =>
                        setTripForm({ ...tripForm, destination: event.target.value })
                      }
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Start date
                      <input
                        type="date"
                        required
                        value={tripForm.start_date}
                        onChange={(event) =>
                          setTripForm({ ...tripForm, start_date: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      End date
                      <input
                        type="date"
                        required
                        min={tripForm.start_date || undefined}
                        value={tripForm.end_date}
                        onChange={(event) =>
                          setTripForm({ ...tripForm, end_date: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    <span>
                      Description <span className="opt">(optional)</span>
                    </span>
                    <textarea
                      rows="3"
                      maxLength={1000}
                      placeholder="What do you want from this trip?"
                      value={tripForm.description}
                      onChange={(event) =>
                        setTripForm({ ...tripForm, description: event.target.value })
                      }
                    />
                  </label>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : editingId ? "Save changes" : "Create trip"}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <p className="modal-sub">
                  Add something to {selectedTrip?.title || "this trip"}.
                </p>
                <form onSubmit={saveActivity} className="form">
                  <label>
                    Activity name
                    <input
                      required
                      autoFocus
                      maxLength={150}
                      placeholder="e.g. Explore a local market"
                      value={activityForm.title}
                      onChange={(event) =>
                        setActivityForm({ ...activityForm, title: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span>
                      Location <span className="opt">(optional)</span>
                    </span>
                    <input
                      maxLength={200}
                      placeholder={selectedTrip?.destination || "Where will it happen?"}
                      value={activityForm.location}
                      onChange={(event) =>
                        setActivityForm({ ...activityForm, location: event.target.value })
                      }
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Date
                      <input
                        type="date"
                        required
                        min={dateInput(selectedTrip?.start_date) || undefined}
                        max={dateInput(selectedTrip?.end_date) || undefined}
                        value={activityForm.activity_date}
                        onChange={(event) =>
                          setActivityForm({ ...activityForm, activity_date: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span>
                        Time <span className="opt">(optional)</span>
                      </span>
                      <input
                        type="time"
                        value={activityForm.activity_time}
                        onChange={(event) =>
                          setActivityForm({ ...activityForm, activity_time: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    <span>
                      Notes <span className="opt">(optional)</span>
                    </span>
                    <textarea
                      rows="3"
                      placeholder="Booking details, tips, reminders"
                      value={activityForm.notes}
                      onChange={(event) =>
                        setActivityForm({ ...activityForm, notes: event.target.value })
                      }
                    />
                  </label>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Adding…" : "Add activity"}
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default App;