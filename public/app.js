const seedBooks = [
  { id: "b-01", title: "Noli Me Tangere", author: "José Rizal", category: "Literature", isbn: "978-971-08-6623-2", shelf: "LIT-A12", copies: 8, available: 3, tone: "rose", status: "active" },
  { id: "b-02", title: "The Little Prince", author: "Antoine de Saint-Exupéry", category: "Fiction", isbn: "978-0-15-601219-5", shelf: "FIC-C08", copies: 6, available: 2, tone: "blue", status: "active" },
  { id: "b-03", title: "Introduction to Biology", author: "Campbell & Reece", category: "Science", isbn: "978-0-13-115075-2", shelf: "SCI-B04", copies: 5, available: 4, tone: "green", status: "active" },
  { id: "b-04", title: "Atomic Habits", author: "James Clear", category: "Personal Growth", isbn: "978-0-7352-1129-2", shelf: "GRO-D02", copies: 4, available: 0, tone: "amber", status: "active" },
  { id: "b-05", title: "Pride and Prejudice", author: "Jane Austen", category: "Classics", isbn: "978-0-14-143951-8", shelf: "CLA-A03", copies: 7, available: 5, tone: "violet", status: "active" },
  { id: "b-06", title: "The Psychology of Money", author: "Morgan Housel", category: "Business", isbn: "978-0-85719-768-9", shelf: "BUS-F11", copies: 3, available: 1, tone: "slate", status: "active" },
  { id: "b-07", title: "Ikigai", author: "Héctor García & Francesc Miralles", category: "Personal Growth", isbn: "978-0-14-313072-7", shelf: "GRO-D07", copies: 5, available: 3, tone: "mint", status: "active" },
  { id: "b-08", title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", isbn: "978-0-553-10953-5", shelf: "SCI-B12", copies: 3, available: 2, tone: "indigo", status: "active" }
];
const seedLoans = [
  { id: "LN-26038", title: "The Little Prince", author: "Antoine de Saint-Exupéry", user: "Alex Morgan", email: "alex.morgan@northview.edu", due: "2026-11-12", status: "borrowed" },
  { id: "LN-26037", title: "Atomic Habits", author: "James Clear", user: "Alex Morgan", email: "alex.morgan@northview.edu", due: "2026-11-10", status: "overdue" },
  { id: "LN-26035", title: "Pride and Prejudice", author: "Jane Austen", user: "Mia Santos", email: "mia.santos@northview.edu", due: "2026-11-18", status: "borrowed" },
  { id: "LN-26031", title: "Noli Me Tangere", author: "José Rizal", user: "Noah Reyes", email: "noah.reyes@northview.edu", due: "2026-11-20", status: "borrowed" }
];
const seedReservations = [
  { id: "RSV-2026-038", title: "The Psychology of Money", user: "Mia Santos", created: "Nov 7, 2026", status: "pending" },
  { id: "RSV-2026-037", title: "A Brief History of Time", user: "Noah Reyes", created: "Nov 6, 2026", status: "approved" },
  { id: "RSV-2026-032", title: "Noli Me Tangere", user: "Sofia Cruz", created: "Nov 4, 2026", status: "declined" }
];
const names = { student: "Alex Morgan", librarian: "Jamie Rivera", administrator: "Taylor Morgan" };
const sections = {
  student: [
    ["Overview", "overview", "⌂"], ["Find a book", "catalog", "⌕"], ["My library", "my-library", "▤"], ["Reservations", "reservations", "◷"]
  ],
  librarian: [
    ["Overview", "overview", "⌂"], ["Book inventory", "inventory", "▤"], ["Borrowing & returns", "transactions", "↔"], ["Reservations", "reservations", "◷"], ["Reports", "reports", "▥"]
  ],
  administrator: [
    ["Overview", "overview", "⌂"], ["Book catalog", "inventory", "▤"], ["People & access", "users", "♙"], ["Activity reports", "reports", "▥"], ["Settings", "settings", "⚙"]
  ]
};
const titles = { overview: "Overview", catalog: "Find a book", "my-library": "My library", reservations: "Reservations", inventory: "Book inventory", transactions: "Borrowing & returns", reports: "Reports & activity", users: "People & access", settings: "System settings" };
const state = {
  role: "student", page: "login", query: "", category: "All categories", filter: "all", modal: null,
  books: load("smartlib_books", seedBooks), loans: load("smartlib_loans", seedLoans), reservations: load("smartlib_reservations", seedReservations),
  settings: loadObject("smartlib_settings", { libraryName: "Northview Community Library", contactEmail: "library@northview.edu", loanPeriod: 14 }),
  toast: "", health: "preview", liveUser: null, users: [{ name: "Alex Morgan", email: "alex.morgan@northview.edu", role: "student", status: "Active" }, { name: "Jamie Rivera", email: "jamie.rivera@northview.edu", role: "librarian", status: "Active" }, { name: "Taylor Morgan", email: "taylor.morgan@northview.edu", role: "administrator", status: "Active" }, { name: "Mia Santos", email: "mia.santos@northview.edu", role: "student", status: "Active" }]
};

function load(key, fallback) { try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) && value.length ? value : structuredClone(fallback); } catch { return structuredClone(fallback); } }
function loadObject(key, fallback) { try { const value = JSON.parse(localStorage.getItem(key)); return value && typeof value === "object" && !Array.isArray(value) ? { ...fallback, ...value } : structuredClone(fallback); } catch { return structuredClone(fallback); } }
function save() { if (state.liveUser) return; localStorage.setItem("smartlib_books", JSON.stringify(state.books)); localStorage.setItem("smartlib_loans", JSON.stringify(state.loans)); localStorage.setItem("smartlib_reservations", JSON.stringify(state.reservations)); }
function esc(v) { return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function icon(name) { return ({ logo: '<svg viewBox="0 0 36 36" fill="none"><rect x="2" y="2" width="32" height="32" rx="10" fill="#dff6ef"/><path d="M10 11.5c3.1-1.5 5.8-1.3 8 .3v14c-2.2-1.6-4.9-1.8-8-.3v-14Zm16 0c-3.1-1.5-5.8-1.3-8 .3v14c2.2-1.6 4.9-1.8 8-.3v-14Z" stroke="#16876e" stroke-width="1.7" stroke-linejoin="round"/><path d="M18 12v14" stroke="#16876e" stroke-width="1.5"/></svg>', bell: "♧", search: "⌕", arrow: "↗", chevron: "⌄", plus: "+", more: "•••", close: "×" }[name] || name); }
function roleName(role = state.role) { return ({ student: "Student", librarian: "Librarian", administrator: "Administrator" })[role]; }
function initials(name) { return String(name).split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase(); }
function todayLabel() { return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()); }
function titleForBook(id) { return state.books.find((b) => b.id === id)?.title || "Book"; }
function countDue() { return state.loans.filter((x) => x.status === "borrowed" || x.status === "overdue").length; }
function getCurrentName() { return state.liveUser?.name || names[state.role]; }

function render() {
  const app = document.querySelector("#app");
  if (state.page === "login" && !state.liveUser) {
    document.title = "Sign in · SmartLib";
    app.innerHTML = `${renderLogin()}<div class="toast ${state.toast ? "visible" : ""}" role="status">${esc(state.toast)}</div>`;
    bindEvents();
    return;
  }
  document.title = `${titles[state.page] || "Overview"} · SmartLib`;
  const menu = sections[state.role];
  app.innerHTML = `<div class="shell">
    <aside class="sidebar">
      <a class="brand" href="#overview" aria-label="SmartLib home">${icon("logo")}<span>smart<span class="brand-green">lib</span></span></a>
      <div class="workspace-label">WORKSPACE</div>
      <div class="role-card"><div class="role-avatar">${initials(getCurrentName())}</div><div class="role-copy"><strong>${esc(getCurrentName())}</strong><span>${esc(roleName())} workspace</span></div><button class="tiny-button" data-action="switch-role" aria-label="Switch role">⌄</button></div>
      <nav class="nav-list" aria-label="Main navigation">${menu.map(([label, page, glyph]) => `<button class="nav-item ${state.page === page ? "active" : ""}" data-page="${page}" aria-label="${label}" title="${label}" aria-current="${state.page === page ? "page" : "false"}"><span class="nav-icon" aria-hidden="true">${glyph}</span><span>${label}</span>${page === "reservations" && state.role !== "student" ? `<i class="nav-count">${state.reservations.filter((r) => r.status === "pending").length}</i>` : ""}</button>`).join("")}</nav>
      <div class="sidebar-bottom"><div class="help-card"><div class="help-icon">✦</div><strong>Need a hand?</strong><p>Find tips for using your library.</p><button data-action="help">Visit help center <span>↗</span></button></div>${state.role === "administrator" ? `<button class="nav-item" data-action="settings"><span class="nav-icon">⚙</span><span>Preferences</span></button>` : ""}<div class="profile-mini"><div class="avatar small">${initials(getCurrentName())}</div><div><strong>${esc(getCurrentName())}</strong><span>${esc(roleName())}</span></div><button class="tiny-button" data-action="profile">•••</button></div></div>
    </aside>
    <main class="main"><header class="topbar"><div class="crumb"><span>${esc(state.settings.libraryName || "Library")}</span><b>/</b><strong>${esc(titles[state.page] || "Overview")}</strong></div><div class="top-actions"><label class="global-search"><span>⌕</span><input id="global-search" placeholder="Search books, authors…" value="${esc(state.query)}" aria-label="Search books"/><kbd>Ctrl K</kbd></label><button class="icon-button notification" data-action="notifications" aria-label="Notifications">♧<i></i></button><div class="top-divider"></div><button class="avatar" data-action="profile" title="Your profile">${initials(getCurrentName())}</button></div></header>
      <div class="page-wrap"><div class="page-heading"><div><div class="eyebrow">${todayLabel()} <span class="status-dot"></span> <span class="connection-label">${state.health === "live" ? (state.liveUser ? "Live database" : "Database ready · preview data") : state.health === "unavailable" ? "Database unavailable" : "Preview workspace"}</span></div><h1>${esc(titles[state.page] || "Overview")}</h1><p class="page-subtitle">${subtitle()}</p></div><div class="heading-actions">${state.health === "live" && !state.liveUser ? `<button class="btn btn-outline" data-action="sign-in">Sign in</button>` : state.role !== "student" ? `<button class="btn btn-primary" data-action="add-book">${icon("plus")} Add a book</button>` : `<button class="btn btn-outline" data-action="browse">Browse catalog ${icon("arrow")}</button>`}</div></div>
      ${renderPage()}</div>
    </main>
  </div>${state.modal ? renderModal() : ""}<div class="toast ${state.toast ? "visible" : ""}" role="status">${esc(state.toast)}</div>`;
  bindEvents();
}
function renderLogin() {
  return `<main class="login-shell">
    <section class="login-showcase" aria-label="SmartLib introduction">
      <a class="brand login-brand" href="/" aria-label="SmartLib home">${icon("logo")}<span>smart<span class="brand-green">lib</span></span></a>
      <div class="login-showcase-copy"><span class="login-overline"><i></i> YOUR COMMUNITY LIBRARY</span><h1>Find your next<br/>favorite story.</h1><p>One welcoming place to discover books, manage your loans, and keep your reading life in motion.</p></div>
      <div class="login-art" aria-hidden="true"><div class="login-art-orbit orbit-one"></div><div class="login-art-orbit orbit-two"></div><div class="login-book book-back"><span></span><i></i></div><div class="login-book book-front"><span></span><i></i><b></b></div><div class="login-art-spark spark-one">✦</div><div class="login-art-spark spark-two">✳</div><div class="login-art-leaf leaf-one"></div><div class="login-art-leaf leaf-two"></div></div>
      <div class="login-showcase-footer"><span>Make room for a little wonder.</span><span>SMARTLIB · 2026</span></div>
    </section>
    <section class="login-main"><div class="login-card">
      <div class="login-card-mark">${icon("logo")}<span>SMARTLIB MEMBER PORTAL</span></div>
      <div class="login-heading"><p class="login-kicker">WELCOME BACK</p><h2>Sign in to your library</h2><p>Your assigned role opens the right workspace: student, librarian, or administrator.</p></div>
      <form id="login-form" class="login-form">
        <label for="login-email">Email address</label><input id="login-email" name="email" type="email" autocomplete="username" required placeholder="you@example.com"/>
        <div class="login-password-label"><label for="login-password">Password</label><a href="mailto:${esc(state.settings.contactEmail || "library@northview.edu")}?subject=SmartLib%20account%20help">Need help?</a></div>
        <div class="login-password-wrap"><input id="login-password" name="password" type="password" autocomplete="current-password" required placeholder="Enter your password"/><button type="button" class="password-toggle" data-action="toggle-password" aria-label="Show password">Show</button></div>
        <button type="submit" class="btn btn-primary login-submit">Sign in <span aria-hidden="true">→</span></button>
      </form>
      <div class="login-separator"><span>OR</span></div>
      <div class="login-demo-label"><strong>Explore a demo workspace</strong><span>Choose a role to preview</span></div>
      <div class="login-demo-roles">${["student", "librarian", "administrator"].map((role) => `<button class="login-role-button" data-action="demo-role" data-id="${role}"><span class="login-role-icon">${role === "student" ? "S" : role === "librarian" ? "L" : "A"}</span><span><strong>${roleName(role)}</strong><small>${esc(names[role])}</small></span><span class="login-role-arrow">→</span></button>`).join("")}</div>
      <p class="login-help">Don’t have an account? Ask your library staff to create one.</p>
      <div class="login-security"><span aria-hidden="true">⌑</span><span>Your account is protected with secure sign-in.</span></div>
    </div><div class="login-footer"><span>© ${new Date().getFullYear()} ${esc(state.settings.libraryName || "SmartLib")}</span><span>Made for readers</span></div></section>
  </main>`;
}
function subtitle() {
  if (state.page === "overview") return state.role === "student" ? "A little reading goes a long way. Pick up where you left off." : state.role === "librarian" ? "Here’s what’s happening at the library today." : "Your library at a glance. Everything is in good order.";
  return ({ catalog: "Explore the collection and find your next favorite.", "my-library": "Keep track of what you’ve borrowed and what’s due back.", reservations: state.role === "student" ? "Follow your requests and reserve something new." : "Review requests and keep the shelves moving.", inventory: "Manage the collection, copies, and shelf locations.", transactions: "Check books out and keep returns moving smoothly.", reports: "A clear view of what’s happening across the library.", users: "Manage accounts, staff roles, and access.", settings: "Tune the library workspace to your needs." })[state.page] || "";
}
function renderPage() {
  switch (state.page) {
    case "catalog": return renderCatalog();
    case "my-library": return renderMyLibrary();
    case "reservations": return renderReservations();
    case "inventory": return renderInventory();
    case "transactions": return renderTransactions();
    case "reports": return renderReports();
    case "users": return renderUsers();
    case "settings": return renderSettings();
    default: return renderOverview();
  }
}
function renderOverview() {
  const isStudent = state.role === "student";
  const memberLoans = state.loans.filter((l) => l.userId === state.liveUser?.id || l.user === getCurrentName() || l.user === names[state.role]);
  const memberReservations = state.reservations.filter((r) => r.userId === state.liveUser?.id || r.user === getCurrentName() || r.user === names[state.role]);
  const activeBooks = state.books.filter((book) => book.status !== "archived");
  const dueSoon = memberLoans.filter((loan) => { const dueDate = new Date(loan.due || loan.dueAt); return loan.status !== "returned" && dueDate >= new Date() && dueDate <= Date.now() + 7 * 86400000; }).length;
  const stats = isStudent ? [
    ["Books borrowed", memberLoans.filter((l) => l.status !== "returned").length, "↗", `${dueSoon} due this week`, "mint"],
    ["Reservations", memberReservations.filter((r) => r.status === "pending").length, "◷", memberReservations.some((r) => r.status === "pending") ? "Awaiting library review" : "No pending requests", "lavender"],
    ["Books returned", memberLoans.filter((l) => l.status === "returned").length, "✓", "In your reading history", "peach"]
  ] : state.role === "librarian" ? [
    ["Books in collection", activeBooks.reduce((a, b) => a + Number(b.copies || 0), 0), "▤", `${activeBooks.length} active titles`, "mint"],
    ["Checked out", countDue(), "↗", "Across all members", "lavender"],
    ["Pending requests", state.reservations.filter((r) => r.status === "pending").length, "◷", "Ready for review", "peach"]
  ] : [
    ["Total books", activeBooks.reduce((a, b) => a + Number(b.copies || 0), 0), "▤", `${activeBooks.length} active titles`, "mint"],
    ["Active members", state.users.length, "♙", "+3 this week", "lavender"],
    ["Open requests", state.reservations.filter((r) => r.status === "pending").length, "◷", "Needs attention", "peach"]
  ];
  const picks = isStudent ? state.books.slice(0, 4) : state.books.slice(0, 3);
  return `<div class="stat-grid">${stats.map(([label, value, symbol, note, tone]) => `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-symbol ${tone}">${symbol}</span></div><strong class="stat-value">${value}</strong><span class="stat-note"><i>↗</i> ${note}</span></article>`).join("")}</div>
    <div class="content-grid"><section class="panel section-panel"><div class="panel-heading"><div><h2>${isStudent ? "Picked for you" : "Popular in the collection"}</h2><p>${isStudent ? "A few titles worth a look." : "Most borrowed books this month."}</p></div><button class="text-button" data-page="${isStudent ? "catalog" : "inventory"}">View collection <span>→</span></button></div>${bookList(picks, isStudent ? "catalog" : "inventory")}</section>
      <aside class="right-column"><section class="panel due-card"><div class="panel-heading"><div><h2>${isStudent ? "Coming up" : "Needs attention"}</h2><p>${isStudent ? "Keep an eye on these dates." : "A quick look at what needs a hand."}</p></div><span class="soft-icon">◷</span></div>${isStudent ? renderDueList() : renderAttentionList()}</section><section class="quote-card"><div class="quote-mark">“</div><p>Reading gives us someplace to go when we have to stay where we are.</p><span>— Mason Cooley</span><div class="quote-spark">✳</div></section></aside></div>
    <section class="panel activity-panel"><div class="panel-heading"><div><h2>${isStudent ? "Recent activity" : "Recent library activity"}</h2><p>Everything happening in your library.</p></div><button class="text-button" data-page="${isStudent ? "my-library" : "transactions"}">See all activity <span>→</span></button></div>${renderActivity()}</section>`;
}
function bookList(books, context) {
  if (!books.length) return `<div class="empty-state">No books found. Try another search.</div>`;
  return `<div class="book-list">${books.map((b) => `<article class="book-row"><div class="cover cover-${esc(b.tone || "blue")}"><div class="cover-lines"></div><span>${esc(b.title.split(/\s+/).slice(0, 2).join(" "))}</span><small>${esc(b.author)}</small></div><div class="book-info"><button class="book-title" data-action="book-details" data-id="${esc(b.id)}">${esc(b.title)}</button><span>${esc(b.author)}</span><div class="book-meta"><span class="category-chip">${esc(b.category)}</span><span>· ${esc(b.shelf || "Shelf TBC")}</span></div></div><div class="availability"><span class="availability-dot ${b.available > 0 ? "available" : "unavailable"}"></span>${b.available > 0 ? `${b.available} available` : "All borrowed"}</div><button class="icon-button row-action" data-action="${context === "catalog" ? "reserve" : "book-details"}" data-id="${esc(b.id)}" aria-label="${context === "catalog" ? "Reserve book" : "Book details"}">${context === "catalog" ? "＋" : "···"}</button></article>`).join("")}</div>`;
}
function renderDueList() {
  const mine = state.loans.filter((l) => (l.userId === state.liveUser?.id || l.user === getCurrentName() || l.user === names[state.role]) && l.status !== "returned").sort((a, b) => new Date(a.due || a.dueAt) - new Date(b.due || b.dueAt)).slice(0, 2);
  if (!mine.length) return `<div class="mini-empty">Nothing due right now. Enjoy your reading ✨</div>`;
  return `<div class="due-list">${mine.map((l) => `<div class="due-item"><div class="mini-book">▤</div><div><strong>${esc(l.title || titleForBook(l.bookId))}</strong><span>Due ${formatDate(l.due || l.dueAt)}</span></div><span class="due-tag ${l.status === "overdue" ? "late" : "soon"}">${l.status === "overdue" ? "Overdue" : "Soon"}</span></div>`).join("")}</div><button class="link-wide" data-page="my-library">View my library →</button>`;
}
function renderAttentionList() {
  const pending = state.reservations.filter((r) => r.status === "pending").slice(0, 2);
  return `${pending.length ? pending.map((r) => `<div class="attention-item"><span class="attention-mark">◷</span><div><strong>${esc(r.user)} requested a book</strong><span>${esc(r.title)}</span></div><button class="tiny-button" data-page="reservations">→</button></div>`).join("") : `<div class="mini-empty">You’re all caught up ✨</div>`}<button class="link-wide" data-page="reservations">Review requests →</button>`;
}
function renderActivity() {
  if (state.liveUser) {
    const events = [
      ...state.loans.map((loan) => ({ date: new Date(loan.returnedAt || loan.checkedOutAt || loan.updatedAt || loan.createdAt || 0), title: loan.status === "returned" ? `${loan.user || "Member"} returned ${loan.title}` : `${loan.user || "Member"} borrowed ${loan.title}`, detail: loan.status === "returned" ? "Returned" : `Due ${formatDate(loan.due || loan.dueAt)}`, type: loan.status === "returned" ? "returned" : "borrowed", mark: loan.status === "returned" ? "↩" : "↗" })),
      ...state.reservations.map((reservation) => ({ date: new Date(reservation.createdAt || 0), title: `${reservation.user || "Member"} requested ${reservation.title || reservation.bookTitle || "a book"}`, detail: formatDate(reservation.createdAt), type: reservation.status === "pending" ? "pending" : "returned", mark: "◷" }))
    ].sort((a, b) => b.date - a.date).slice(0, 4);
    if (!events.length) return `<div class="mini-empty">Your library activity will appear here.</div>`;
    return `<div class="activity-list">${events.map((event) => `<div class="activity-row"><span class="activity-mark ${event.type}">${event.mark}</span><div><strong>${esc(event.title)}</strong><span>${esc(event.detail)}</span></div><span class="activity-kind">${esc(event.type)}</span></div>`).join("")}</div>`;
  }
  const events = [
    ["↗", "You borrowed The Little Prince", "Today · 10:24 AM", "borrowed"], ["◷", "Reservation for The Psychology of Money", "Yesterday · 3:18 PM", "pending"], ["↩", "You returned Introduction to Biology", "Nov 4 · 1:42 PM", "returned"]
  ];
  return `<div class="activity-list">${events.map(([mark, title, time, type]) => `<div class="activity-row"><span class="activity-mark ${type}">${mark}</span><div><strong>${title}</strong><span>${time}</span></div><span class="activity-kind">${type}</span></div>`).join("")}</div>`;
}
function renderCatalog() {
  let books = state.books.filter((b) => b.status !== "archived");
  if (state.query) { const q = state.query.toLowerCase(); books = books.filter((b) => `${b.title} ${b.author} ${b.category} ${b.isbn}`.toLowerCase().includes(q)); }
  if (state.category !== "All categories") books = books.filter((b) => b.category === state.category);
  if (state.filter === "available") books = books.filter((b) => b.available > 0);
  return `<section class="catalog-tools"><label class="catalog-search"><span>⌕</span><input id="catalog-search" placeholder="Search by title, author, or ISBN" value="${esc(state.query)}"/><kbd>/</kbd></label><select id="category-filter" aria-label="Filter by category">${["All categories", ...new Set(state.books.map((b) => b.category))].map((c) => `<option ${state.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></section><div class="filter-row"><div><button class="filter-pill ${state.filter === "all" ? "selected" : ""}" data-filter="all">All books <span>${state.books.length}</span></button><button class="filter-pill ${state.filter === "available" ? "selected" : ""}" data-filter="available">Available now</button></div><span class="results-label">${books.length} ${books.length === 1 ? "book" : "books"}</span></div><section class="panel catalog-panel">${bookList(books, "catalog")}</section>`;
}
function renderMyLibrary() {
  const mine = state.liveUser ? state.loans : state.loans.filter((l) => l.user === names.student || l.user === getCurrentName());
  const loans = mine.length ? mine : state.liveUser ? [] : state.loans.slice(0, 2);
  const returned = mine.filter((l) => l.status === "returned");
  return `<div class="substats"><div><span>Currently borrowed</span><strong>${loans.filter((l) => l.status !== "returned").length}</strong></div><div><span>Due this week</span><strong>${loans.filter((l) => { const dueDate = new Date(l.due || l.dueAt); return l.status !== "returned" && dueDate >= new Date() && dueDate <= Date.now() + 7 * 86400000; }).length}</strong></div><div><span>Books read</span><strong>${returned.length}</strong></div></div><section class="panel table-panel"><div class="panel-heading"><div><h2>Borrowed books</h2><p>Your current checkouts and due dates.</p></div><button class="btn btn-outline btn-sm" data-action="browse">Find a book</button></div>${table(["Book", "Borrowed", "Due date", "Status"], loans.map((l) => `<tr><td><div class="table-book"><span class="table-book-icon">▤</span><div><strong>${esc(l.title)}</strong><small>${esc(l.author || "Library collection")}</small></div></div></td><td>${l.checkedOutAt ? formatDate(l.checkedOutAt) : "—"}</td><td>${formatDate(l.due || l.dueAt)}</td><td>${statusPill(l.status)}</td></tr>`))}</section><section class="panel table-panel lower-panel"><div class="panel-heading"><div><h2>Reading history</h2><p>Books you’ve already returned.</p></div></div>${returned.length ? table(["Book", "Returned", "Status"], returned.map((l) => `<tr><td>${esc(l.title)}</td><td>${formatDate(l.returnedAt)}</td><td>${statusPill("returned")}</td></tr>`)) : `<div class="empty-state">Your returned books will show up here.</div>`}</section>`;
}
function renderReservations() {
  const mine = state.role === "student" ? state.reservations.filter((r) => r.user === names.student || r.user === getCurrentName() || r.userId === state.liveUser?.id) : state.reservations;
  const rows = state.filter === "pending" ? mine.filter((r) => r.status === "pending") : mine;
  return `<div class="filter-row"><div><button class="filter-pill ${state.filter !== "pending" ? "selected" : ""}" data-filter="all">${state.role === "student" ? "My requests" : "All requests"} <span>${mine.length}</span></button>${state.role !== "student" ? `<button class="filter-pill ${state.filter === "pending" ? "selected" : ""}" data-filter="pending">Needs review <span>${mine.filter((r) => r.status === "pending").length}</span></button>` : ""}</div>${state.role === "student" ? `<button class="btn btn-primary btn-sm" data-action="browse">＋ Find a book</button>` : ""}</div><section class="panel table-panel">${table(state.role === "student" ? ["Book", "Requested", "Request ID", "Status"] : ["Request", "Member", "Requested", "Status", "Action"], rows.map((r) => `<tr><td><div class="table-book"><span class="table-book-icon">▤</span><div><strong>${esc(r.title || r.bookTitle || titleForBook(r.bookId))}</strong><small>${state.role === "student" ? "Library collection" : esc(r.id)}</small></div></div></td>${state.role !== "student" ? `<td>${esc(r.user || r.userName || "Member")}</td>` : ""}<td>${esc(r.created || formatDate(r.createdAt) || "—")}</td>${state.role === "student" ? `<td>${esc(r.id)}</td>` : ""}<td>${statusPill(r.status)}</td>${state.role !== "student" ? `<td>${r.status === "pending" ? `<button class="text-button" data-action="approve" data-id="${esc(r.id)}">Approve</button><button class="text-button danger-text" data-action="decline" data-id="${esc(r.id)}">Decline</button>` : "—"}</td>` : ""}</tr>`))}</section>`;
}
function renderInventory() {
  let books = state.books.filter((b) => b.status !== "archived").filter((b) => !state.query || `${b.title} ${b.author} ${b.isbn}`.toLowerCase().includes(state.query.toLowerCase()));
  if (state.category !== "All categories") books = books.filter((b) => b.category === state.category);
  if (state.filter === "low") books = books.filter((b) => Number(b.available) <= 1);
  const collection = state.books.filter((b) => b.status !== "archived");
  return `<section class="catalog-tools"><label class="catalog-search"><span>⌕</span><input id="catalog-search" placeholder="Search inventory" value="${esc(state.query)}" aria-label="Search inventory"/></label><select id="category-filter" aria-label="Filter by category">${["All categories", ...new Set(collection.map((b) => b.category))].map((c) => `<option ${state.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></section><div class="filter-row"><div><button class="filter-pill ${state.filter !== "low" ? "selected" : ""}" data-filter="all">All titles <span>${collection.length}</span></button><button class="filter-pill ${state.filter === "low" ? "selected" : ""}" data-filter="low">Low availability <span>${collection.filter((b) => b.available <= 1).length}</span></button></div><span class="results-label">${collection.reduce((n, b) => n + Number(b.copies || 0), 0)} total copies</span></div><section class="panel table-panel">${table(["Title", "Category", "Shelf", "Copies", "Availability", ""], books.map((b) => `<tr><td><div class="table-book"><span class="table-book-icon">▤</span><div><strong>${esc(b.title)}</strong><small>${esc(b.author)} · ISBN ${esc(b.isbn)}</small></div></div></td><td><span class="category-chip">${esc(b.category)}</span></td><td>${esc(b.shelf)}</td><td>${b.copies}</td><td><span class="availability-dot ${b.available > 0 ? "available" : "unavailable"}"></span>${b.available} / ${b.copies} available</td><td><button class="icon-button" data-action="book-details" data-id="${esc(b.id)}" aria-label="Book details for ${esc(b.title)}">···</button></td></tr>`))}</section>`;
}
function renderTransactions() {
  const allRows = state.loans;
  const rows = state.filter === "borrowed" ? allRows.filter((l) => l.status === "borrowed") : state.filter === "overdue" ? allRows.filter((l) => l.status === "overdue") : allRows;
  return `<div class="substats"><div><span>Active loans</span><strong>${allRows.filter((l) => l.status === "borrowed").length}</strong></div><div><span>Overdue</span><strong class="text-rose">${allRows.filter((l) => l.status === "overdue").length}</strong></div><div><span>Returned</span><strong>${allRows.filter((l) => l.status === "returned").length}</strong></div></div><div class="filter-row"><div><button class="filter-pill ${state.filter === "all" ? "selected" : ""}" data-filter="all">All activity <span>${allRows.length}</span></button><button class="filter-pill ${state.filter === "borrowed" ? "selected" : ""}" data-filter="borrowed">Currently borrowed</button><button class="filter-pill ${state.filter === "overdue" ? "selected" : ""}" data-filter="overdue">Overdue</button></div><button class="btn btn-primary btn-sm" data-action="checkout">＋ Check out a book</button></div><section class="panel table-panel">${table(["Transaction", "Member", "Due date", "Status", ""], rows.map((l) => `<tr><td><div class="table-book"><span class="table-book-icon">▤</span><div><strong>${esc(l.title || titleForBook(l.bookId))}</strong><small>${esc(l.id)}</small></div></div></td><td><div class="member-cell"><span class="avatar mini">${initials(l.user || l.userName || "Member")}</span><div><strong>${esc(l.user || l.userName || "Member")}</strong><small>${esc(l.email || "")}</small></div></div></td><td>${formatDate(l.due || l.dueAt)}</td><td>${statusPill(l.status)}</td><td>${l.status !== "returned" ? `<button class="text-button" data-action="return-book" data-id="${esc(l.id)}">Mark returned</button>` : ""}</td></tr>`))}</section>`;
}
function renderReports() {
  const popular = [...state.books].sort((a, b) => b.copies - a.copies).slice(0, 5);
  return `<div class="report-grid"><section class="panel report-panel"><div class="panel-heading"><div><h2>Library activity</h2><p>Checkout activity over the last 7 days.</p></div><select class="small-select"><option>Last 7 days</option><option>Last 30 days</option></select></div><div class="chart"><div class="chart-y"><span>60</span><span>40</span><span>20</span><span>0</span></div><div class="chart-area"><div class="chart-grid"></div><svg viewBox="0 0 600 190" preserveAspectRatio="none" aria-label="Weekly activity chart"><defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2da88d" stop-opacity=".2"/><stop offset="1" stop-color="#2da88d" stop-opacity="0"/></linearGradient></defs><path d="M0,140 C35,132 45,105 90,116 S145,88 180,102 230,57 265,75 312,99 350,74 400,98 440,60 490,82 530,37 575,51 595,25 V190 H0Z" fill="url(#fade)"/><path d="M0,140 C35,132 45,105 90,116 S145,88 180,102 230,57 265,75 312,99 350,74 400,98 440,60 490,82 530,37 575,51 595,25" fill="none" stroke="#2da88d" stroke-width="3" vector-effect="non-scaling-stroke"/></svg><div class="chart-x"><span>Nov 2</span><span>Nov 3</span><span>Nov 4</span><span>Nov 5</span><span>Nov 6</span><span>Nov 7</span><span>Nov 8</span></div></div></div></section><section class="panel report-panel"><div class="panel-heading"><div><h2>Collection snapshot</h2><p>Books by the numbers.</p></div></div><div class="snapshot"><div><span>Available copies</span><strong>${state.books.reduce((a,b)=>a+Number(b.available||0),0)}</strong><i class="snapshot-bar mint-bar"></i></div><div><span>Currently borrowed</span><strong>${countDue()}</strong><i class="snapshot-bar blue-bar"></i></div><div><span>Pending reservations</span><strong>${state.reservations.filter(r=>r.status==="pending").length}</strong><i class="snapshot-bar peach-bar"></i></div></div></section></div><section class="panel table-panel lower-panel"><div class="panel-heading"><div><h2>Collection highlights</h2><p>Popular titles in the library.</p></div></div>${table(["Book", "Category", "Copies", "Available"], popular.map(b=>`<tr><td><strong>${esc(b.title)}</strong><small class="block-muted">${esc(b.author)}</small></td><td>${esc(b.category)}</td><td>${b.copies}</td><td>${b.available}</td></tr>`))}</section>`;
}
function renderUsers() { const users = state.filter === "students" ? state.users.filter((u) => u.role === "student") : state.filter === "staff" ? state.users.filter((u) => u.role !== "student") : state.users; return `<div class="filter-row"><div><button class="filter-pill ${state.filter === "all" ? "selected" : ""}" data-filter="all">All accounts <span>${state.users.length}</span></button><button class="filter-pill ${state.filter === "students" ? "selected" : ""}" data-filter="students">Students</button><button class="filter-pill ${state.filter === "staff" ? "selected" : ""}" data-filter="staff">Staff</button></div><button class="btn btn-primary btn-sm" data-action="add-user">＋ Add an account</button></div><section class="panel table-panel">${table(["Member", "Role", "Access", ""], users.map((u)=>`<tr><td><div class="member-cell"><span class="avatar mini">${initials(u.name)}</span><div><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></div></div></td><td>${roleName(u.role)}</td><td>${statusPill((u.status || "active").toLowerCase())}</td><td><button class="text-button" data-action="toggle-user" data-id="${esc(u.id || state.users.indexOf(u))}">${u.status === "disabled" ? "Restore access" : "Disable access"}</button></td></tr>`))}</section>`; }
function renderSettings() { return `<div class="settings-grid"><section class="panel settings-panel"><div class="panel-heading"><div><h2>Library details</h2><p>Basic information members see around the workspace.</p></div></div><label>Library name<input name="libraryName" value="${esc(state.settings.libraryName)}" maxlength="120"/></label><label>Contact email<input name="contactEmail" type="email" value="${esc(state.settings.contactEmail)}" maxlength="254"/></label><label>Default loan period<select name="loanPeriod"><option value="7" ${Number(state.settings.loanPeriod)===7?"selected":""}>7 days</option><option value="14" ${Number(state.settings.loanPeriod)===14?"selected":""}>14 days</option><option value="21" ${Number(state.settings.loanPeriod)===21?"selected":""}>21 days</option></select></label><button class="btn btn-primary" data-action="save-settings">Save changes</button></section><section class="panel settings-panel"><div class="panel-heading"><div><h2>Database</h2><p>Application data source.</p></div></div><div class="database-status"><span class="db-orb ${state.health}"></span><div><strong>${state.health === "live" ? "MongoDB connected" : state.health === "unavailable" ? "Database unavailable" : "Preview mode"}</strong><span>${state.health === "live" ? "Live collections are ready." : "Sample records are stored in this browser."}</span></div></div><p class="settings-hint">Configure <code>MONGODB_URI</code>, <code>MONGODB_DB</code> (optional), and <code>SESSION_SECRET</code> in your hosting environment. Keep secrets server-side.</p><button class="btn btn-outline" data-action="refresh-health">Check connection</button></section></div>`; }
function table(headers, rows) { if (!rows.length) return `<div class="empty-state">No records yet.</div>`; return `<div class="table-scroll"><table><thead><tr>${headers.map((h)=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`; }
function statusPill(status) { const text = status === "borrowed" ? "Borrowed" : status === "returned" ? "Returned" : status === "overdue" ? "Overdue" : status === "approved" ? "Approved" : status === "declined" ? "Declined" : status === "active" ? "Active" : status === "pending" ? "Pending" : status; return `<span class="status-pill ${esc(status)}"><i></i>${esc(text)}</span>`; }
function formatDate(date) { const d = new Date(date); if (Number.isNaN(d.getTime())) return "—"; return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(d); }

function renderModal() {
  const m = state.modal;
  if (m.type === "book") {
    const b = state.books.find(x => x.id === m.id);
    if (!b) return "";
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal book-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="modal-close" data-action="close-modal" aria-label="Close">×</button><div class="modal-book-top"><div class="cover cover-${esc(b.tone || "blue")} large-cover"><div class="cover-lines"></div><span>${esc(b.title)}</span><small>${esc(b.author)}</small></div><div><span class="category-chip">${esc(b.category)}</span><h2 id="modal-title">${esc(b.title)}</h2><p class="modal-author">by ${esc(b.author)}</p><span class="availability-dot ${b.available > 0 ? "available" : "unavailable"}"></span><span class="availability-text">${b.available > 0 ? `${b.available} of ${b.copies} copies available` : "All copies are borrowed"}</span></div></div><div class="detail-grid"><div><span>ISBN</span><strong>${esc(b.isbn || "Not listed")}</strong></div><div><span>Shelf location</span><strong>${esc(b.shelf || "Not assigned")}</strong></div><div><span>Collection</span><strong>${esc(b.category)}</strong></div></div><div class="modal-actions">${state.role === "student" ? `<button class="btn btn-primary" data-action="reserve" data-id="${esc(b.id)}" ${b.available < 1 ? "disabled" : ""}>Request this book</button>` : `<button class="btn btn-primary" data-action="edit-book" data-id="${esc(b.id)}">Edit book details</button>${state.liveUser ? `<button class="btn btn-outline" data-action="archive-book" data-id="${esc(b.id)}">Archive title</button>` : ""}`}<button class="btn btn-outline" data-action="close-modal">Close</button></div></section></div>`;
  }
  const isBook = m.type === "add-book" || m.type === "edit-book";
  const editing = m.type === "edit-book" ? state.books.find(x => x.id === m.id) : null;
  const title = editing ? "Edit book details" : isBook ? "Add a book" : m.type === "checkout" ? "Check out a book" : m.type === "login" ? "Sign in to SmartLib" : "Add a member";
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="modal-close" data-action="close-modal" aria-label="Close dialog">×</button><span class="modal-kicker">${isBook ? "COLLECTION" : m.type === "checkout" ? "CIRCULATION" : m.type === "login" ? "YOUR LIBRARY ACCOUNT" : "MEMBERS"}</span><h2 id="modal-title">${title}</h2><p class="modal-sub">${isBook ? "Keep the collection details up to date." : m.type === "checkout" ? "Start a new loan for a library member." : m.type === "login" ? "Use your library email and password." : state.liveUser ? "Set a temporary password for the new library account." : "Create an account for someone in your library preview."}</p><form id="modal-form">${m.type === "login" ? `<label>Email address<input name="email" type="email" required autocomplete="username" placeholder="name@school.edu"/></label><label>Password<input name="password" type="password" required autocomplete="current-password"/></label>` : isBook ? `<label>Book title<input name="title" required value="${esc(editing?.title || "")}" placeholder="e.g. The Midnight Library"/></label><label>Author<input name="author" required value="${esc(editing?.author || "")}" placeholder="Author name"/></label><div class="form-row"><label>Category<select name="category">${["Literature","Fiction","Science","Business","Classics","Personal Growth","History","Other"].map(x=>`<option ${editing?.category===x?"selected":""}>${x}</option>`).join("")}</select></label><label>ISBN<input name="isbn" value="${esc(editing?.isbn || "")}" placeholder="978…"/></label></div><div class="form-row"><label>Shelf location<input name="shelf" value="${esc(editing?.shelf || "")}" placeholder="e.g. LIT-A12"/></label><label>Number of copies<input name="copies" type="number" min="0" value="${editing?.copies ?? 1}"/></label></div>` : m.type === "checkout" ? `<label>Member name<input name="member" required placeholder="Search member name or email" list="member-list"/><datalist id="member-list">${state.users.map(u=>`<option value="${esc(u.name)}">${esc(u.email)}</option>`).join("")}</datalist></label><label>Book<select name="book" required>${state.books.filter(b=>b.available>0).map(b=>`<option value="${esc(b.id)}">${esc(b.title)} · ${b.available} available</option>`).join("")}</select></label><label>Due date<input name="due" type="date" min="${new Date().toISOString().slice(0,10)}" value="${new Date(Date.now()+Number(state.settings.loanPeriod || 14)*86400000).toISOString().slice(0,10)}"/></label>` : `<label>Full name<input name="name" required minlength="2" maxlength="120" autocomplete="name" placeholder="Member name"/></label><label>Email address<input name="email" type="email" required autocomplete="email" maxlength="254" placeholder="name@school.edu"/></label>${state.liveUser ? `<label>Temporary password<input name="password" type="password" required minlength="12" autocomplete="new-password" placeholder="At least 12 characters"/></label>` : ""}<label>Role<select name="role"><option value="student">Student</option><option value="librarian">Librarian</option><option value="administrator">Administrator</option></select></label>`}<div class="modal-actions"><button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">${editing ? "Save changes" : m.type === "checkout" ? "Check out book" : m.type === "login" ? "Sign in" : isBook ? "Add to collection" : "Create account"}</button></div></form></section></div>`;
}

function bindEvents() {
  document.querySelectorAll("[data-page]").forEach((el) => el.addEventListener("click", () => { if (state.page !== el.dataset.page) state.filter = "all"; state.page = el.dataset.page; state.modal = null; render(); }));
  document.querySelectorAll("[data-action]").forEach((el) => el.addEventListener("click", (event) => { if (el.classList.contains("modal-backdrop") && event.target !== el) return; action(el.dataset.action, el.dataset.id); }));
  document.querySelectorAll("[data-filter]").forEach((el) => el.addEventListener("click", () => { state.filter = el.dataset.filter; render(); }));
  for (const id of ["global-search", "catalog-search"]) { const input = document.getElementById(id); if (input) input.addEventListener("input", () => { state.query = input.value; if (id === "global-search" && state.query && state.page !== "catalog" && state.page !== "inventory") { state.page = state.role === "student" ? "catalog" : "inventory"; state.filter = "all"; } renderKeepingFocus(id, state.query); }); }
  const cat = document.getElementById("category-filter"); if (cat) cat.addEventListener("change", () => { state.category = cat.value; render(); });
  const form = document.getElementById("modal-form"); if (form) form.addEventListener("submit", submitModal);
  const loginForm = document.getElementById("login-form"); if (loginForm) loginForm.addEventListener("submit", async (event) => { event.preventDefault(); await authenticate(Object.fromEntries(new FormData(loginForm))); });
}
function renderKeepingFocus(id, value) { render(); const next = document.getElementById(id) || document.getElementById(id === "global-search" ? "catalog-search" : "global-search"); if (next) { next.focus(); next.setSelectionRange(value.length, value.length); } }
function keyHandler(e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); document.getElementById("global-search")?.focus(); } if (e.key === "Escape" && state.modal) { state.modal = null; render(); } }
function action(name, id) {
  if (name === "switch-role") { if (state.liveUser) return toast("Your live account role is managed by an administrator."); const roles = ["student", "librarian", "administrator"]; state.role = roles[(roles.indexOf(state.role) + 1) % roles.length]; state.page = "overview"; render(); return; }
  if (name === "browse") { state.page = state.role === "student" ? "catalog" : "inventory"; state.filter = "all"; render(); return; }
  if (name === "add-book") { state.modal = { type: "add-book" }; render(); return; }
  if (name === "checkout") { state.modal = { type: "checkout" }; render(); return; }
  if (name === "add-user") { state.modal = { type: "add-user" }; render(); return; }
  if (name === "sign-in" || (name === "profile" && state.health === "live" && !state.liveUser)) { state.modal = null; state.page = "login"; history.pushState({}, "", "/login"); render(); return; }
  if (name === "demo-role" || name === "demo-preview") { const role = ["student", "librarian", "administrator"].includes(id) ? id : "student"; state.liveUser = null; state.role = role; state.health = "preview"; state.page = "overview"; state.modal = null; state.books = load("smartlib_books", seedBooks); state.loans = load("smartlib_loans", seedLoans); state.reservations = load("smartlib_reservations", seedReservations); state.settings = loadObject("smartlib_settings", { libraryName: "Northview Community Library", contactEmail: "library@northview.edu", loanPeriod: 14 }); history.replaceState({}, "", "/"); state.toast = `You’re previewing the ${roleName(role).toLowerCase()} workspace.`; render(); return; }
  if (name === "toggle-password") { const input = document.getElementById("login-password"); if (input) { input.type = input.type === "password" ? "text" : "password"; document.querySelector(".password-toggle")?.setAttribute("aria-label", input.type === "password" ? "Show password" : "Hide password"); document.querySelector(".password-toggle").textContent = input.type === "password" ? "Show" : "Hide"; } return; }
  if (name === "book-details") { state.modal = { type: "book", id }; render(); return; }
  if (name === "edit-book") { state.modal = { type: "edit-book", id }; render(); return; }
  if (name === "close-modal") { state.modal = null; render(); return; }
  if (name === "reserve") { reserveBook(id); return; }
  if (name === "approve" || name === "decline") { updateReservation(id, name === "approve" ? "approved" : "declined"); return; }
  if (name === "return-book") { returnLoan(id); return; }
  if (name === "help") { toast("Help center is coming soon."); return; }
  if (name === "profile") { if (state.liveUser) { signOut(); return; } toast(`${getCurrentName()} · ${roleName()}`); return; }
  if (name === "notifications") { toast(state.reservations.some(r => r.status === "pending") ? "You have reservation requests to review." : "You’re all caught up."); return; }
  if (name === "settings") { if (state.role !== "administrator") return toast("Library settings are managed by an administrator."); state.filter = "all"; state.page = "settings"; render(); return; }
  if (name === "refresh-health") { checkHealth(); return; }
  if (name === "save-settings") { saveSettings(); return; }
  if (name === "archive-book") { archiveBook(id); return; }
  if (name === "toggle-user") { toggleUser(id); return; }
}
function reserveBook(id) {
  const book = state.books.find(b => b.id === id);
  if (!book || book.available < 1) return toast("This title is currently unavailable.");
  const user = getCurrentName();
  if (state.reservations.some(r => r.title === book.title && r.user === user && r.status === "pending")) return toast("You already have a pending request for this title.");
  if (state.liveUser) {
    apiRecord("reservations", "POST", { bookId: book.id, bookTitle: book.title }).then(result => {
      if (!result) return;
      state.reservations.unshift({ ...result.item, id: result.item._id, title: book.title, user, created: todayLabel() });
      state.modal = null; render(); toast("Book request sent to the library.");
    });
    return;
  }
  state.reservations.unshift({ id: `RSV-2026-${String(39 + state.reservations.length).padStart(3, "0")}`, title: book.title, user, created: todayLabel(), status: "pending" });
  state.modal = null; save(); toast("Book request sent to the library."); render();
}
async function submitModal(event) {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const type = state.modal?.type;
  if (type === "login") {
    await authenticate(data);
    return;
  }
  if (type === "add-book" || type === "edit-book") {
    const id = state.modal.id; const old = state.books.find(b => b.id === id); const copies = Math.max(0, Number(data.copies) || 0);
    const book = { id: id || `b-${Date.now()}`, title: data.title.trim(), author: data.author.trim(), category: data.category, isbn: data.isbn.trim(), shelf: data.shelf.trim() || "Unassigned", copies, available: old ? Math.max(0, copies - (old.copies - old.available)) : copies, tone: old?.tone || ["rose","blue","green","amber","violet","mint"][state.books.length % 6], status: "active" };
    if (state.liveUser) { const result = await apiRecord("books", old ? "PATCH" : "POST", old ? { id: old.id, updates: book } : book); if (!result) return; if (result.item) book.id = result.item._id; }
    if (old) Object.assign(old, book); else state.books.unshift(book);
    save(); state.modal = null; toast(old ? "Book details updated." : "Book added to the collection."); render(); return;
  }
  if (type === "checkout") {
    const book = state.books.find(b => b.id === data.book); if (!book || book.available < 1) return toast("No copy is available for checkout.");
    const member = state.users.find(u => u.name.toLowerCase() === data.member.toLowerCase() || u.email.toLowerCase() === data.member.toLowerCase());
    if (state.liveUser) { if (!member?._id) return toast("Select an existing member account by name or email."); const result = await apiRecord("loans", "POST", { bookId: book.id, userId: member._id, user: member.name, title: book.title, author: book.author, dueAt: data.due }); if (!result) return; }
    state.loans.unshift({ id: `LN-${Date.now().toString().slice(-5)}`, title: book.title, author: book.author, user: member?.name || data.member, email: member?.email || "member@northview.edu", due: data.due, status: "borrowed" });
    book.available--; save(); state.modal = null; toast("Book checked out successfully."); render(); return;
  }
  if (type === "add-user") {
    const account = { name: data.name.trim(), email: data.email.trim().toLowerCase(), role: data.role, status: "active" };
    if (state.liveUser) {
      const result = await apiRecord("users", "POST", { ...account, password: data.password });
      if (!result) return;
      state.users.unshift({ ...result.item, id: result.item._id });
      state.modal = null; state.filter = "all"; toast("Library account created. Share the temporary password securely."); render(); return;
    }
    state.users.unshift({ ...account, status: "Active" }); state.modal = null; state.filter = "all"; toast("Preview member account added."); render();
  }
}
async function authenticate(credentials) {
  try {
    const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
    const result = await response.json();
    if (!response.ok) { toast(result.error || "Sign in failed."); return false; }
    state.liveUser = result.user; state.role = result.user.role; state.health = "live"; state.page = "overview"; state.modal = null; history.replaceState({}, "", "/");
    await restoreRecords(); toast(`Welcome, ${result.user.name} · ${roleName(result.user.role)} workspace.`); return true;
  } catch { toast("Could not reach the library service."); return false; }
}
function toast(message) { state.toast = message; render(); setTimeout(() => { state.toast = ""; document.querySelector(".toast")?.classList.remove("visible"); }, 2600); }
async function saveSettings() {
  const settings = { libraryName: document.querySelector('[name="libraryName"]')?.value.trim(), contactEmail: document.querySelector('[name="contactEmail"]')?.value.trim().toLowerCase(), loanPeriod: Number(document.querySelector('[name="loanPeriod"]')?.value) };
  if (!settings.libraryName || !settings.contactEmail || ![7, 14, 21].includes(settings.loanPeriod)) return toast("Enter a library name, valid email, and loan period.");
  if (state.liveUser) {
    const result = await apiRecord("settings", "PATCH", { id: "library", updates: settings });
    if (!result) return;
    state.settings = result.item;
  } else {
    state.settings = settings;
    localStorage.setItem("smartlib_settings", JSON.stringify(settings));
  }
  toast("Library settings saved."); render();
}
function checkHealth() { fetch("/api/health").then(r => r.json()).then(d => { state.health = d.database === "connected" ? "live" : d.database === "unavailable" ? "unavailable" : "preview"; if (state.health === "live" && !state.liveUser) { state.page = "login"; if (window.location.pathname !== "/login") history.replaceState({}, "", "/login"); } render(); }).catch(() => { state.health = "preview"; render(); }); }
async function restoreSession() { try { const response = await fetch("/api/session"); const data = await response.json(); if (data.authenticated && data.user) { state.liveUser = data.user; state.role = data.user.role; state.health = "live"; state.page = "overview"; if (window.location.pathname === "/login") history.replaceState({}, "", "/"); await restoreRecords(); } } catch { /* preview mode */ } }

async function apiRecord(type, method, body) {
  try { const query = new URLSearchParams({ type }); if (method === "DELETE" && body?.id) query.set("id", body.id); const response = await fetch(`/api/records?${query}`, { method, headers: { "Content-Type": "application/json" }, body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(body) }); const result = await response.json(); if (!response.ok) { toast(result.error || "Database update failed."); return null; } return result; }
  catch { toast("Could not reach the library database."); return null; }
}
async function archiveBook(id) {
  const book = state.books.find((item) => item.id === id);
  if (!book) return;
  if (state.liveUser) {
    const result = await apiRecord("books", "DELETE", { id: book._id || book.id });
    if (!result) return;
  }
  book.status = "archived"; save(); state.modal = null; toast("Book archived from the catalog."); render();
}
async function toggleUser(id) {
  const account = state.users.find((item, index) => item.id === id || (!item.id && String(index) === id));
  if (!account) return;
  if (state.liveUser && account.id === state.liveUser.id && account.status !== "disabled") return toast("You cannot disable your own account.");
  const nextStatus = account.status === "disabled" ? "active" : "disabled";
  if (state.liveUser) {
    const result = await apiRecord("users", "PATCH", { id: account.id, updates: { status: nextStatus } });
    if (!result) return;
  }
  account.status = nextStatus; toast(nextStatus === "active" ? "Account access restored." : "Account access disabled."); render();
}
async function updateReservation(id, status) {
  const r = state.reservations.find(x => x.id === id);
  if (!r) return;
  if (state.liveUser) { const result = await apiRecord("reservations", "PATCH", { id: r._id || r.id, updates: { status, reviewedAt: new Date(), reviewedBy: state.liveUser.name } }); if (!result) return; }
  r.status = status; save(); toast(`Request ${status}.`); render();
}
async function returnLoan(id) {
  const loan = state.loans.find(x => x.id === id || x._id === id);
  if (!loan) return;
  const returnedAt = new Date().toISOString();
  if (state.liveUser) { const result = await apiRecord("loans", "PATCH", { id: loan._id || loan.id, updates: { status: "returned", returnedAt } }); if (!result) return; }
  loan.status = "returned"; loan.returnedAt = returnedAt; const book = state.books.find(x => x.title === loan.title); if (book) book.available = Math.min(book.copies, book.available + 1); save(); toast("Book marked as returned."); render();
}
async function restoreRecords() {
  const types = state.role === "student" ? ["books", "loans", "reservations"] : state.role === "administrator" ? ["books", "loans", "reservations", "users", "settings"] : ["books", "loans", "reservations", "users"];
  const results = await Promise.all(types.map(async type => { const response = await fetch(`/api/records?type=${type}`); return response.ok ? [type, await response.json()] : [type, { items: [] }]; }));
  for (const [type, data] of results) { const items = data.items || []; if (type === "books") state.books = items.map(b => ({ ...b, id: b._id })); if (type === "loans") state.loans = items.map(l => ({ ...l, id: l._id, title: l.title || titleForBook(l.bookId), user: l.user || l.userName || "Member", due: l.dueAt, status: l.status === "borrowed" && l.dueAt && new Date(l.dueAt) < new Date() ? "overdue" : l.status })); if (type === "reservations") state.reservations = items.map(r => ({ ...r, id: r._id, title: r.title || r.bookTitle || titleForBook(r.bookId), user: r.user || r.userName || "Member", created: r.created || r.createdAt })); if (type === "users") state.users = items.map(u => ({ ...u, id: u._id, role: u.role, status: u.status || "active" })); if (type === "settings" && data.item) state.settings = data.item; }
  save(); render();
}
async function signOut() {
  try { await fetch("/api/session", { method: "DELETE" }); } catch { /* local state is cleared even if the request fails */ }
  state.liveUser = null; state.role = "student"; state.page = "login"; state.health = "preview"; history.replaceState({}, "", "/login");
  state.books = load("smartlib_books", seedBooks); state.loans = load("smartlib_loans", seedLoans); state.reservations = load("smartlib_reservations", seedReservations);
  toast("You’ve signed out."); checkHealth();
}

window.addEventListener("popstate", () => {
  if (window.location.pathname === "/login" && !state.liveUser) state.page = "login";
  else if (state.health === "live" && !state.liveUser) { state.page = "login"; history.replaceState({}, "", "/login"); }
  else state.page = "overview";
  render();
});
render();
document.addEventListener("keydown", keyHandler);
checkHealth();
restoreSession();
