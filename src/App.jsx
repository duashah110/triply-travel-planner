import { useCallback, useEffect, useMemo, useState } from "react";
import "./index.css";

const API = import.meta.env.PROD ? "" : "http://localhost:5000";

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

const FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
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

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

// "upcoming" | "ongoing" | "past" | "undated"
function tripStatus(trip) {
  if (!trip.start_date || !trip.end_date) return "undated";
  const today = startOfToday();
  if (toDate(trip.end_date) < today) return "past";
  if (toDate(trip.start_date) > today) return "upcoming";
  return "ongoing";
}

function daysUntil(dateStr) {
  return Math.round((toDate(dateStr) - startOfToday()) / 86400000);
}

function statusLabel(trip) {
  const status = tripStatus(trip);
  if (status === "ongoing") return "Happening now";
  if (status === "past") return "Completed";
  if (status === "upcoming") {
    const n = daysUntil(trip.start_date);
    if (n === 1) return "Tomorrow";
    return `In ${n} days`;
  }
  return "Dates tbd";
}

function passwordScore(password) {
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
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
  mail: "M4 5h16v14H4zM4 7l8 6 8-6",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff:
    "M3 3l18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 6.7C3.7 8.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2",
  logout: "M9 4H5v16h4M16 8l4 4-4 4M20 12H9",
  check: "M5 12.5l4.5 4.5L19 7",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5 5-2z",
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

/* ---------- auth screen ---------- */

function AuthField({ icon, label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-box">
        <Icon name={icon} size={18} />
        {children}
      </span>
    </label>
  );
}

function AuthScreen({ mode, setMode, form, setForm, busy, error, onSubmit }) {
  const [showPassword, setShowPassword] = useState(false);
  const [quote] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const signup = mode === "signup";
  const score = passwordScore(form.password);
  const strengthText = ["Too short", "Okay", "Good", "Strong", "Excellent"][
    form.password.length < 12 ? 0 : Math.max(1, score)
  ];

  return (
    <div className="auth">
      <div className="stripe-top" aria-hidden="true" />

      <section className="auth-art" aria-hidden="false">
        <a className="brand brand-light" href="#top" aria-label="Triply home">
          <span className="brand-plane">
            <Icon name="plane" size={18} />
          </span>
          triply
        </a>

        <div className="auth-art-body">
          <h1 className="auth-headline">
            <span className="line"><span>Your next trip</span></span>
            <span className="line"><span>starts here.</span></span>
          </h1>
          <p className="auth-lede">
            Keep every destination, date and detour in one place, and turn
            “someday” into a day-by-day plan.
          </p>

          <div className="auth-postcard-wrap">
            <div className="auth-postcard">
              <blockquote>“{QUOTES[quote]}”</blockquote>
              <span className="pc-sign">your future self</span>
              <div className="auth-postcard-stamp">
                <Stamp />
              </div>
              <Postmark />
            </div>
          </div>

          <ul className="auth-points">
            <li><Icon name="check" size={15} /> Plan trips with dates and destinations</li>
            <li><Icon name="check" size={15} /> Build a day-by-day itinerary</li>
            <li><Icon name="check" size={15} /> Your trips are saved to your account</li>
          </ul>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Account">
            <button
              type="button"
              role="tab"
              aria-selected={!signup}
              className={!signup ? "is-on" : ""}
              onClick={() => setMode("login")}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={signup}
              className={signup ? "is-on" : ""}
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </div>

          <h2 className="auth-title">
            {signup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="auth-sub">
            {signup
              ? "It takes a minute. Then start planning your first trip."
              : "Log in to see your trips and pick up where you left off."}
          </p>

          <form onSubmit={onSubmit} className="auth-form" noValidate={false}>
            {signup && (
              <AuthField icon="user" label="Your name">
                <input
                  required
                  autoComplete="name"
                  placeholder="Alex Traveler"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </AuthField>
            )}

            <AuthField icon="mail" label="Email">
              <input
                required
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </AuthField>

            <AuthField icon="lock" label="Password">
              <input
                required
                type={showPassword ? "text" : "password"}
                minLength={signup ? 12 : undefined}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={signup ? "At least 12 characters" : "Your password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="field-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
              </button>
            </AuthField>

            {signup && (
              <div className="strength" aria-live="polite">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((n) => (
                    <i
                      key={n}
                      className={
                        form.password.length >= 12 && score >= n
                          ? `on s${score}`
                          : form.password.length > 0 && n === 1 && form.password.length < 12
                            ? "on s0"
                            : ""
                      }
                    />
                  ))}
                </div>
                <span>
                  {form.password ? strengthText : "Use 12 or more characters"}
                </span>
              </div>
            )}

            {error && (
              <div className="auth-error" role="alert">
                <Icon name="close" size={14} />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={busy} className="auth-submit">
              {busy
                ? "Please wait…"
                : signup
                  ? "Create account"
                  : "Log in"}
            </Button>
          </form>

          <p className="auth-switch">
            {signup ? "Already have an account?" : "New to Triply?"}
            <button
              type="button"
              onClick={() => setMode(signup ? "login" : "signup")}
            >
              {signup ? "Log in" : "Create an account"}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---------- app ---------- */

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [trips, setTrips] = useState([]);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activities, setActivities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tripForm, setTripForm] = useState(blankTrip);
  const [activityForm, setActivityForm] = useState(blankActivity);
  const [editingId, setEditingId] = useState(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [quote, setQuote] = useState(() => Math.floor(Math.random() * QUOTES.length));

  useEffect(() => {
    request("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");

    try {
      const result = await request(
        authMode === "signup" ? "/api/auth/signup" : "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(authForm),
        }
      );

      setUser(result.user);
      setAuthForm({ name: "", email: "", password: "" });
      setLoading(true);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  }

  function switchAuthMode(mode) {
    setAuthMode(mode);
    setAuthError("");
  }

  async function handleLogout() {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed:", err);
    }

    setUser(null);
    setTrips([]);
    setActivities([]);
    setSelectedId(null);
    setLoading(false);
  }

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
    if (!authChecked) return;

    if (user) {
      setLoading(true);
      loadTrips();
    } else {
      setTrips([]);
      setActivities([]);
      setLoading(false);
    }
  }, [authChecked, user, loadTrips]);

  useEffect(() => {
    if (user && selectedId != null) {
      loadActivities(selectedId);
    } else {
      setActivities([]);
    }
  }, [user, selectedId, loadActivities]);

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
    return trips.filter((trip) => {
      const status = tripStatus(trip);
      if (filter === "upcoming" && !(status === "upcoming" || status === "ongoing" || status === "undated")) {
        return false;
      }
      if (filter === "past" && status !== "past") return false;
      if (!term) return true;
      return [trip.title, trip.destination, trip.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [trips, search, filter]);

  const totalDays = trips.reduce(
    (sum, trip) => sum + (tripLength(trip) || 0),
    0
  );

  // The trip happening now, or the soonest one still to come.
  const nextTrip = useMemo(() => {
    const live = trips.find((trip) => tripStatus(trip) === "ongoing");
    if (live) return live;
    return trips
      .filter((trip) => tripStatus(trip) === "upcoming")
      .sort((a, b) => dateInput(a.start_date).localeCompare(dateInput(b.start_date)))[0];
  }, [trips]);

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
          body: JSON.stringify(tripForm),
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
  const firstName = (user?.name || "").trim().split(/\s+/)[0] || "traveler";
  const selectedStatus = selectedTrip ? tripStatus(selectedTrip) : null;

  if (!authChecked) {
    return (
      <main className="splash">
        <span className="splash-plane">
          <Icon name="plane" size={30} />
        </span>
        <p>Packing your bags…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={switchAuthMode}
        form={authForm}
        setForm={setAuthForm}
        busy={authBusy}
        error={authError}
        onSubmit={handleAuthSubmit}
      />
    );
  }

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

          <div className="top-actions">
            <div className="user-chip" title={user.email || ""}>
              <span className="avatar">{firstName.charAt(0).toUpperCase()}</span>
              <span className="user-name">{user.name || "Traveler"}</span>
            </div>
            <Button variant="soft" onClick={handleLogout} aria-label="Log out">
              <Icon name="logout" />
              <span className="hide-sm">Log out</span>
            </Button>
          </div>
        </header>

        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">
              <Icon name="compass" size={15} />
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              <span aria-hidden="true">·</span> Trip board
            </p>
            <h1>
              <span className="line"><span>Pack the bag.</span></span>
              <span className="line"><span>Plan the days.</span></span>
            </h1>
            <p className="hero-line">
              {nextTrip ? (
                <>
                  {tripStatus(nextTrip) === "ongoing" ? (
                    <>You're in <mark>{nextTrip.destination}</mark> right now. Enjoy every minute.</>
                  ) : (
                    <>
                      <mark>{nextTrip.destination}</mark> is{" "}
                      {daysUntil(nextTrip.start_date) === 1
                        ? "tomorrow"
                        : `${daysUntil(nextTrip.start_date)} days away`}
                      . Time to finish the plan.
                    </>
                  )}
                </>
              ) : trips.length ? (
                <>
                  <mark>{trips.length}</mark> {trips.length === 1 ? "trip" : "trips"} on the board. Ready for the next one?
                </>
              ) : (
                <>Your board is empty. Pick a place and start your first trip.</>
              )}
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
                  <div className="pc-line">To: {user.name || "you"}</div>
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

        <section className="stats" aria-label="Your travel summary">
          <div className="stat stat-sun">
            <span className="stat-icon"><Icon name="compass" size={22} /></span>
            <div>
              <strong>{trips.length}</strong>
              <span>{trips.length === 1 ? "trip planned" : "trips planned"}</span>
            </div>
          </div>
          <div className="stat stat-blush">
            <span className="stat-icon"><Icon name="calendar" size={22} /></span>
            <div>
              <strong>{totalDays}</strong>
              <span>{totalDays === 1 ? "day to look forward to" : "days to look forward to"}</span>
            </div>
          </div>
          <div className="stat stat-sky">
            <span className="stat-icon"><Icon name="pin" size={22} /></span>
            <div>
              <strong>{selectedTrip ? activities.length : 0}</strong>
              <span>
                {selectedTrip
                  ? `${activities.length === 1 ? "activity" : "activities"} in ${selectedTrip.destination}`
                  : "activities planned"}
              </span>
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
              {!loading && trips.length > 0 && (
                <span className="count">{filteredTrips.length}</span>
              )}
            </div>

            {trips.length > 0 && (
              <>
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

                <div className="filters" role="group" aria-label="Filter trips">
                  {FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={filter === item.id ? "is-on" : ""}
                      aria-pressed={filter === item.id}
                      onClick={() => setFilter(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {loading ? (
              <div className="trip-list">
                {[1, 2, 3].map((item) => (
                  <div className="skeleton" key={item} />
                ))}
              </div>
            ) : filteredTrips.length === 0 ? (
              search || filter !== "all" ? (
                <div className="empty">
                  <h3>No matches</h3>
                  <p>
                    {search
                      ? `Nothing matches “${search}”. Try a different name or place.`
                      : `No ${filter} trips right now.`}
                  </p>
                  <Button
                    variant="soft"
                    onClick={() => {
                      setSearch("");
                      setFilter("all");
                    }}
                  >
                    Clear filters
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
                  const status = tripStatus(trip);

                  return (
                    <div
                      className={`ticket tone-${tone} ${isActive ? "is-active" : ""} ${status === "past" ? "is-past" : ""}`}
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
                          <span className={`status status-${status}`}>
                            {statusLabel(trip)}
                          </span>
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
                    <Icon name="calendar" size={26} />
                  </span>
                  <h3>{trips.length ? "Pick a trip" : "Your itinerary lives here"}</h3>
                  <p>
                    {trips.length
                      ? "Select a ticket on the left to see its day-by-day plan."
                      : "Once you create a trip, its day-by-day plan shows up here."}
                  </p>
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
                      <span className={`chip chip-status status-${selectedStatus}`}>
                        {statusLabel(selectedTrip)}
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

        <footer className="foot">
          <span>triply</span>
          <span>Made for people who pack late and plan early.</span>
        </footer>
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