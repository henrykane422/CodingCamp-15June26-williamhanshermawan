/* =============================================================
   Life Dashboard — script.js
   Features:
     - Live clock & greeting (with custom name)
     - Focus Timer (Pomodoro) with custom duration
     - To-Do List with add / edit / delete / complete + duplicate guard
     - Quick Links
     - Light / Dark mode toggle
     All data persisted via localStorage
   ============================================================= */

// ─────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────

/** Save any value (JSON) to localStorage */
function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Read a value from localStorage, returns null if not found */
function loadFromStorage(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

// ─────────────────────────────────────────────
// 1. CLOCK, DATE & GREETING
// ─────────────────────────────────────────────

const clockEl    = document.getElementById('clock');
const dateEl     = document.getElementById('date');
const greetingEl = document.getElementById('greeting');
const displayNameEl = document.getElementById('display-name');

/** Returns greeting string based on current hour */
function getGreeting(hour) {
  if (hour >= 5 && hour < 12)  return 'Good Morning,';
  if (hour >= 12 && hour < 18) return 'Good Afternoon,';
  return 'Good Evening,';
}

/** Pad number to 2 digits */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Update clock, date and greeting every second */
function updateClock() {
  const now  = new Date();
  const h    = now.getHours();
  const m    = now.getMinutes();
  const s    = now.getSeconds();

  clockEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

  // Format date: e.g. "Friday, June 19, 2026"
  dateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  greetingEl.textContent = getGreeting(h);
}

// Start clock immediately and refresh every second
updateClock();
setInterval(updateClock, 1000);

// ─────────────────────────────────────────────
// 2. CUSTOM NAME  (Challenge #2)
// ─────────────────────────────────────────────

const nameModal      = document.getElementById('name-modal');
const nameInput      = document.getElementById('name-input');
const editNameBtn    = document.getElementById('edit-name-btn');
const saveNameBtn    = document.getElementById('save-name-btn');
const cancelNameBtn  = document.getElementById('cancel-name-btn');

/** Load saved name or default to "Friend" */
function initName() {
  const saved = loadFromStorage('userName');
  displayNameEl.textContent = saved || 'Friend';
}

/** Open the name-edit modal */
function openNameModal() {
  nameInput.value = displayNameEl.textContent === 'Friend' ? '' : displayNameEl.textContent;
  nameModal.hidden = false;
  nameInput.focus();
}

/** Close the name-edit modal */
function closeNameModal() {
  nameModal.hidden = true;
}

/** Save the entered name */
function saveName() {
  const name = nameInput.value.trim();
  if (name) {
    displayNameEl.textContent = name;
    saveToStorage('userName', name);
  }
  closeNameModal();
}

editNameBtn.addEventListener('click', openNameModal);
saveNameBtn.addEventListener('click', saveName);
cancelNameBtn.addEventListener('click', closeNameModal);

// Allow pressing Enter in name input
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveName();
  if (e.key === 'Escape') closeNameModal();
});

// Close modal on overlay click
nameModal.addEventListener('click', (e) => {
  if (e.target === nameModal) closeNameModal();
});

initName();

// ─────────────────────────────────────────────
// 3. LIGHT / DARK MODE TOGGLE  (Challenge #1)
// ─────────────────────────────────────────────

const themeToggleBtn = document.getElementById('theme-toggle');
const themeIconEl    = document.getElementById('theme-icon');

/** Apply theme to <html> element and update icon */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/** Toggle between light and dark */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  saveToStorage('theme', next);
}

// Load saved theme or default to light
function initTheme() {
  const saved = loadFromStorage('theme');
  applyTheme(saved || 'light');
}

themeToggleBtn.addEventListener('click', toggleTheme);
initTheme();

// ─────────────────────────────────────────────
// 4. FOCUS TIMER (Pomodoro)
// ─────────────────────────────────────────────

const timerDisplayEl  = document.getElementById('timer-display');
const startBtn        = document.getElementById('start-btn');
const pauseBtn        = document.getElementById('pause-btn');
const resetBtn        = document.getElementById('reset-btn');
const customMinInput  = document.getElementById('custom-minutes');
const setTimerBtn     = document.getElementById('set-timer-btn');

let timerInterval  = null;   // setInterval reference
let totalSeconds   = 0;      // current countdown value in seconds
let defaultMinutes = 25;     // default (or user-saved) duration

/** Load saved timer duration from localStorage */
function initTimer() {
  const saved = loadFromStorage('timerMinutes');
  defaultMinutes = saved ? Number(saved) : 25;
  totalSeconds = defaultMinutes * 60;
  renderTimer();
}

/** Render MM:SS into the display */
function renderTimer() {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  timerDisplayEl.textContent = `${pad(m)}:${pad(s)}`;
}

/** Start the countdown */
function startTimer() {
  if (timerInterval) return; // already running

  startBtn.disabled = true;
  pauseBtn.disabled = false;

  timerInterval = setInterval(() => {
    if (totalSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerDisplayEl.textContent = '00:00';
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      // Notify user
      timerDisplayEl.style.color = '#e74c3c';
      if (Notification && Notification.permission === 'granted') {
        new Notification('⏰ Focus session complete!');
      } else {
        alert('⏰ Focus session complete! Great work!');
      }
      timerDisplayEl.style.color = '';
      return;
    }
    totalSeconds--;
    renderTimer();
  }, 1000);
}

/** Pause / resume the countdown */
function pauseTimer() {
  if (timerInterval) {
    // Currently running → pause it
    clearInterval(timerInterval);
    timerInterval = null;
    pauseBtn.textContent = 'Resume';
    startBtn.disabled = true;
  } else {
    // Currently paused → resume
    startTimer();
    pauseBtn.textContent = 'Pause';
  }
}

/** Reset to default duration */
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  totalSeconds = defaultMinutes * 60;
  renderTimer();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = 'Pause';
}

/** Apply a custom duration entered by the user */
function setCustomTimer() {
  const val = parseInt(customMinInput.value, 10);
  if (!val || val < 1 || val > 120) {
    customMinInput.focus();
    return;
  }
  defaultMinutes = val;
  saveToStorage('timerMinutes', val);
  resetTimer();
  customMinInput.value = '';
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
setTimerBtn.addEventListener('click', setCustomTimer);

// Allow Enter key in custom minutes input
customMinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') setCustomTimer();
});

// Request notification permission on first interaction
document.addEventListener('click', () => {
  if (Notification && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, { once: true });

initTimer();

// ─────────────────────────────────────────────
// 5. TO-DO LIST
// ─────────────────────────────────────────────

const todoInput       = document.getElementById('todo-input');
const addTodoBtn      = document.getElementById('add-todo-btn');
const todoListEl      = document.getElementById('todo-list');
const todoFooterEl    = document.getElementById('todo-footer');
const duplicateWarn   = document.getElementById('duplicate-warning');

let todos = []; // Array of { id, text, done }

/** Generate a simple unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Load tasks from localStorage */
function initTodos() {
  todos = loadFromStorage('todos') || [];
  renderTodos();
}

/** Persist tasks */
function saveTodos() {
  saveToStorage('todos', todos);
}

/** Re-render the entire todo list */
function renderTodos() {
  todoListEl.innerHTML = '';

  todos.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', 'Mark task complete');
    checkbox.addEventListener('change', () => toggleTodo(task.id));

    // Text span
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = task.text;

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'todo-btn edit';
    editBtn.title = 'Edit task';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => startEditTodo(task.id, li, textSpan));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-btn delete';
    deleteBtn.title = 'Delete task';
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => deleteTodo(task.id));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(actionsDiv);
    todoListEl.appendChild(li);
  });

  renderTodoFooter();
}

/** Render the count summary and "Clear done" button */
function renderTodoFooter() {
  const total = todos.length;
  const done  = todos.filter(t => t.done).length;

  if (total === 0) {
    todoFooterEl.innerHTML = '<span>No tasks yet. Add one above!</span>';
    return;
  }

  todoFooterEl.innerHTML = `
    <span>${done} / ${total} completed</span>
    ${done > 0 ? '<button class="clear-done-btn" id="clear-done-btn">Clear completed</button>' : ''}
  `;

  const clearBtn = document.getElementById('clear-done-btn');
  if (clearBtn) clearBtn.addEventListener('click', clearDoneTodos);
}

/** Check for a duplicate task (case-insensitive) */
function isDuplicate(text) {
  return todos.some(t => t.text.toLowerCase() === text.toLowerCase());
}

/** Show/hide duplicate warning */
function showDuplicateWarning(show) {
  duplicateWarn.hidden = !show;
  if (show) {
    setTimeout(() => { duplicateWarn.hidden = true; }, 2500);
  }
}

/** Add a new task */
function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Challenge #3: Prevent duplicate tasks
  if (isDuplicate(text)) {
    showDuplicateWarning(true);
    todoInput.select();
    return;
  }

  todos.unshift({ id: uid(), text, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  showDuplicateWarning(false);
}

/** Toggle a task's done state */
function toggleTodo(id) {
  const task = todos.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTodos();
    renderTodos();
  }
}

/** Delete a task */
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

/** Replace the text span with an inline input for editing */
function startEditTodo(id, li, textSpan) {
  const task = todos.find(t => t.id === id);
  if (!task) return;

  // Replace text span with input
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value = task.text;
  editInput.maxLength = 100;

  li.replaceChild(editInput, textSpan);
  editInput.focus();
  editInput.select();

  // Replace edit button with save button
  const actionsDiv = li.querySelector('.todo-actions');
  const editBtn = actionsDiv.querySelector('.edit');
  const saveBtn = document.createElement('button');
  saveBtn.className = 'todo-btn save';
  saveBtn.title = 'Save changes';
  saveBtn.textContent = '💾';
  actionsDiv.replaceChild(saveBtn, editBtn);

  /** Commit the edit */
  function commitEdit() {
    const newText = editInput.value.trim();
    if (!newText) return;

    // Duplicate check (excluding the current task itself)
    const duplicate = todos.some(t => t.id !== id && t.text.toLowerCase() === newText.toLowerCase());
    if (duplicate) {
      showDuplicateWarning(true);
      editInput.select();
      return;
    }

    task.text = newText;
    saveTodos();
    renderTodos();
  }

  saveBtn.addEventListener('click', commitEdit);
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  commitEdit();
    if (e.key === 'Escape') renderTodos(); // cancel edit
  });
}

/** Remove all completed tasks */
function clearDoneTodos() {
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
}

// Events
addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

initTodos();

// ─────────────────────────────────────────────
// 6. QUICK LINKS
// ─────────────────────────────────────────────

const linkNameInput = document.getElementById('link-name');
const linkUrlInput  = document.getElementById('link-url');
const addLinkBtn    = document.getElementById('add-link-btn');
const linksListEl   = document.getElementById('links-list');

let links = []; // Array of { id, name, url }

/** Load links from localStorage */
function initLinks() {
  links = loadFromStorage('quickLinks') || [];
  renderLinks();
}

/** Persist links */
function saveLinks() {
  saveToStorage('quickLinks', links);
}

/** Re-render the links list */
function renderLinks() {
  linksListEl.innerHTML = '';

  if (links.length === 0) {
    linksListEl.innerHTML = '<li style="font-size:0.83rem;color:var(--text-muted)">No links yet. Add one above!</li>';
    return;
  }

  links.forEach((link) => {
    const li = document.createElement('li');
    li.className = 'link-item';

    const anchor = document.createElement('a');
    anchor.className = 'link-anchor';
    anchor.href = link.url;
    anchor.textContent = link.name;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'link-delete-btn';
    deleteBtn.title = 'Delete link';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => deleteLink(link.id));

    li.appendChild(anchor);
    li.appendChild(deleteBtn);
    linksListEl.appendChild(li);
  });
}

/** Ensure a URL has a protocol prefix */
function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

/** Add a new quick link */
function addLink() {
  const name = linkNameInput.value.trim();
  const rawUrl = linkUrlInput.value.trim();
  if (!name || !rawUrl) return;

  const url = normalizeUrl(rawUrl);

  links.push({ id: uid(), name, url });
  saveLinks();
  renderLinks();

  linkNameInput.value = '';
  linkUrlInput.value  = '';
}

/** Delete a link by id */
function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

// Events
addLinkBtn.addEventListener('click', addLink);

// Allow Enter key in either link input
[linkNameInput, linkUrlInput].forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addLink();
  });
});

initLinks();
