// Task Manager - script.js
// handles all the CRUD operations, filters, sorting and theme

'use strict';

// storing tasks in an array
let tasks = [];
let deleteTargetId = null;

// current filter/sort state
let state = {
  filterStatus: 'all',
  filterCategory: 'all',
  sortBy: 'created',
  searchQuery: '',
};

// shortcut to get elements by id
function getEl(id) {
  return document.getElementById(id);
}

// grab all the elements i need
let taskGrid      = getEl('taskGrid');
let emptyState    = getEl('emptyState');
let searchInput   = getEl('searchInput');
let searchClear   = getEl('searchClear');
let sortSelect    = getEl('sortSelect');
let addTaskBtn    = getEl('addTaskBtn');
let emptyAddBtn   = getEl('emptyAddBtn');

let taskModal     = getEl('taskModal');
let modalBackdrop = getEl('modalBackdrop');
let modalTitle    = getEl('modalTitle');
let modalClose    = getEl('modalClose');
let cancelBtn     = getEl('cancelBtn');
let saveTaskBtn   = getEl('saveTaskBtn');

let taskTitle     = getEl('taskTitle');
let taskDesc      = getEl('taskDesc');
let taskPriority  = getEl('taskPriority');
let taskCategory  = getEl('taskCategory');
let taskDue       = getEl('taskDue');
let editId        = getEl('editId');
let charCount     = getEl('charCount');

let confirmModal  = getEl('confirmModal');
let confirmCancel = getEl('confirmCancel');
let confirmDelete = getEl('confirmDelete');

let sidebar       = getEl('sidebar');
let hamburger     = getEl('hamburger');
let sidebarClose  = getEl('sidebarClose');
let overlay       = getEl('overlay');
let themeToggle   = getEl('themeToggle');
let themeIcon     = getEl('themeIcon');
let themeLabel    = getEl('themeLabel');
let toastContainer = getEl('toastContainer');

// generate a unique id for each task
function generateId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// save tasks to localStorage
function saveTasks() {
  localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

// load tasks from localStorage
function loadTasks() {
  let saved = localStorage.getItem('taskflow_tasks');
  tasks = saved ? JSON.parse(saved) : [];
}

// load and apply saved theme
function loadTheme() {
  let saved = localStorage.getItem('taskflow_theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('taskflow_theme', theme);
  if (theme === 'dark') {
    themeIcon.textContent = '☀';
    themeLabel.textContent = 'Light Mode';
  } else {
    themeIcon.textContent = '☽';
    themeLabel.textContent = 'Dark Mode';
  }
}

// format date like "Apr 3, 2026"
function formatDate(dateStr) {
  if (!dateStr) return null;
  let parts = dateStr.split('-');
  let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
}

// check if a due date is overdue or coming soon
function getDueSeverity(dateStr) {
  if (!dateStr) return '';
  let due = new Date(dateStr);
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  let diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'overdue';
  if (diff <= 3) return 'soon';
  return '';
}

// used for sorting by priority
function priorityRank(p) {
  if (p === 'high') return 0;
  if (p === 'medium') return 1;
  return 2;
}

// safely escape html so users cant inject stuff
function escapeHtml(str) {
  let div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// show a toast notification
function showToast(msg, type, duration) {
  type = type || 'default';
  duration = duration || 3000;

  let toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  toastContainer.appendChild(toast);

  setTimeout(function() {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    toast.addEventListener('animationend', function() {
      toast.remove();
    });
  }, duration);
}

// filter and sort the tasks based on current state
function getFilteredTasks() {
  let list = [...tasks];

  // search filter
  if (state.searchQuery) {
    let q = state.searchQuery.toLowerCase();
    list = list.filter(function(t) {
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    });
  }

  // status filter
  if (state.filterStatus !== 'all') {
    list = list.filter(function(t) {
      return t.status === state.filterStatus;
    });
  }

  // category filter
  if (state.filterCategory !== 'all') {
    list = list.filter(function(t) {
      return t.category === state.filterCategory;
    });
  }

  // sorting
  list.sort(function(a, b) {
    if (state.sortBy === 'priority') {
      return priorityRank(a.priority) - priorityRank(b.priority);
    } else if (state.sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (state.sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else {
      // default: newest first
      return b.createdAt - a.createdAt;
    }
  });

  return list;
}

// render all tasks to the page
function renderTasks() {
  let list = getFilteredTasks();

  // update stats
  let total = tasks.length;
  let pending = tasks.filter(function(t) { return t.status === 'pending'; }).length;
  let completed = tasks.filter(function(t) { return t.status === 'completed'; }).length;
  let highPriority = tasks.filter(function(t) { return t.priority === 'high' && t.status === 'pending'; }).length;
  let percent = total ? Math.round((completed / total) * 100) : 0;

  getEl('statTotal').textContent   = total;
  getEl('statHigh').textContent    = highPriority;
  getEl('statPending').textContent = pending;
  getEl('statDone').textContent    = completed;
  getEl('progressFill').style.width = percent + '%';
  getEl('progressPct').textContent  = percent + '%';

  // update sidebar badges
  getEl('badge-all').textContent       = tasks.length;
  getEl('badge-pending').textContent   = pending;
  getEl('badge-completed').textContent = completed;

  // show empty state if no results
  if (list.length === 0) {
    taskGrid.innerHTML = '';
    taskGrid.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  taskGrid.style.display = 'grid';
  emptyState.style.display = 'none';
  taskGrid.innerHTML = list.map(buildCard).join('');
  addCardListeners();
}

// build the HTML for a single task card
function buildCard(task) {
  let dueSeverity = getDueSeverity(task.dueDate);
  let isDone = task.status === 'completed';
  let checkClass = isDone ? 'checked' : '';
  let checkMark = isDone ? '✓' : '';

  let dueDateHtml = '';
  if (task.dueDate) {
    let icon = dueSeverity === 'overdue' ? '⚠' : '◷';
    dueDateHtml = '<span class="due-date ' + dueSeverity + '">' + icon + ' ' + formatDate(task.dueDate) + '</span>';
  }

  let arrow = task.priority === 'high' ? '↑' : task.priority === 'medium' ? '→' : '↓';
  let descHtml = task.description ? '<p class="task-desc">' + escapeHtml(task.description) + '</p>' : '';

  return '<article class="task-card ' + task.priority + (isDone ? ' completed-card' : '') + '" data-id="' + task.id + '">' +
    '<div class="card-header">' +
      '<div class="card-header-left">' +
        '<button class="task-checkbox ' + checkClass + '" data-action="toggle" data-id="' + task.id + '">' + checkMark + '</button>' +
        '<h3 class="task-title">' + escapeHtml(task.title) + '</h3>' +
      '</div>' +
      '<div class="card-actions">' +
        '<button class="action-btn edit" data-action="edit" data-id="' + task.id + '">✎</button>' +
        '<button class="action-btn delete" data-action="delete" data-id="' + task.id + '">⊗</button>' +
      '</div>' +
    '</div>' +
    descHtml +
    '<div class="card-meta">' +
      '<span class="badge badge-priority ' + task.priority + '">' + arrow + ' ' + task.priority + '</span>' +
      '<span class="badge badge-category ' + task.category + '">' + task.category + '</span>' +
      '<span class="badge badge-status ' + task.status + '">' + task.status + '</span>' +
      dueDateHtml +
    '</div>' +
  '</article>';
}

// attach click handlers to the card buttons
function addCardListeners() {
  taskGrid.querySelectorAll('[data-action]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      let action = btn.dataset.action;
      let id = btn.dataset.id;
      if (action === 'toggle') toggleTask(id);
      if (action === 'edit') openEditModal(id);
      if (action === 'delete') openConfirm(id);
    });
  });
}

// add a new task
function addTask(data) {
  let task = {
    id: generateId(),
    title: data.title.trim(),
    description: data.description.trim(),
    priority: data.priority,
    category: data.category,
    dueDate: data.dueDate || null,
    status: 'pending',
    createdAt: Date.now(),
  };
  tasks.unshift(task);
  saveTasks();
  renderTasks();
  showToast('Task created ✓', 'success');
}

// update an existing task
function updateTask(id, data) {
  let index = tasks.findIndex(function(t) { return t.id === id; });
  if (index === -1) return;
  tasks[index] = {
    ...tasks[index],
    title: data.title.trim(),
    description: data.description.trim(),
    priority: data.priority,
    category: data.category,
    dueDate: data.dueDate || null,
    updatedAt: Date.now(),
  };
  saveTasks();
  renderTasks();
  showToast('Task updated ✓', 'success');
}

// delete a task by id
function deleteTask(id) {
  tasks = tasks.filter(function(t) { return t.id !== id; });
  saveTasks();
  renderTasks();
  showToast('Task deleted', 'warning');
}

// toggle task between pending and completed
function toggleTask(id) {
  let task = tasks.find(function(t) { return t.id === id; });
  if (!task) return;
  task.status = task.status === 'completed' ? 'pending' : 'completed';
  saveTasks();
  renderTasks();
  let msg = task.status === 'completed' ? 'Marked complete ✓' : 'Marked pending';
  let type = task.status === 'completed' ? 'success' : 'default';
  showToast(msg, type);
}

// open modal to add a new task
function openAddModal() {
  editId.value = '';
  modalTitle.textContent = 'New Task';
  taskTitle.value    = '';
  taskDesc.value     = '';
  taskPriority.value = 'medium';
  taskCategory.value = 'work';
  taskDue.value      = '';
  charCount.textContent = '0/80';
  showModal();
  taskTitle.focus();
}

// open modal to edit an existing task
function openEditModal(id) {
  let task = tasks.find(function(t) { return t.id === id; });
  if (!task) return;
  editId.value = id;
  modalTitle.textContent = 'Edit Task';
  taskTitle.value    = task.title;
  taskDesc.value     = task.description;
  taskPriority.value = task.priority;
  taskCategory.value = task.category;
  taskDue.value      = task.dueDate || '';
  charCount.textContent = task.title.length + '/80';
  showModal();
  taskTitle.focus();
}

function showModal() {
  taskModal.classList.add('active');
  modalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  taskModal.classList.remove('active');
  if (!confirmModal.classList.contains('active')) {
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// validate and save the form
function saveTask() {
  let title = taskTitle.value.trim();
  if (!title) {
    taskTitle.style.borderColor = 'var(--high)';
    taskTitle.focus();
    showToast('Title is required', 'error');
    setTimeout(function() { taskTitle.style.borderColor = ''; }, 1500);
    return;
  }

  let data = {
    title: title,
    description: taskDesc.value,
    priority: taskPriority.value,
    category: taskCategory.value,
    dueDate: taskDue.value,
  };

  if (editId.value) {
    updateTask(editId.value, data);
  } else {
    addTask(data);
  }
  closeModal();
}

// open the delete confirmation dialog
function openConfirm(id) {
  deleteTargetId = id;
  confirmModal.classList.add('active');
  modalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeConfirm() {
  deleteTargetId = null;
  confirmModal.classList.remove('active');
  modalBackdrop.classList.remove('active');
  document.body.style.overflow = '';
}

// sidebar open/close
function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// update the page title based on current filter
function updatePageTitle() {
  let statusNames = { all: 'All Tasks', pending: 'Pending Tasks', completed: 'Completed Tasks' };
  let catNames = { all: '', work: ' · Work', study: ' · Study', personal: ' · Personal' };
  getEl('pageTitle').textContent = statusNames[state.filterStatus] + (catNames[state.filterCategory] || '');
}

// button listeners
addTaskBtn.addEventListener('click', openAddModal);
emptyAddBtn.addEventListener('click', openAddModal);

modalClose.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
saveTaskBtn.addEventListener('click', saveTask);

modalBackdrop.addEventListener('click', function() {
  if (confirmModal.classList.contains('active')) {
    closeConfirm();
  } else {
    closeModal();
  }
});

confirmCancel.addEventListener('click', closeConfirm);
confirmDelete.addEventListener('click', function() {
  if (deleteTargetId) deleteTask(deleteTargetId);
  closeConfirm();
});

// search input
searchInput.addEventListener('input', function() {
  state.searchQuery = searchInput.value;
  searchClear.classList.toggle('visible', !!searchInput.value);
  renderTasks();
});

searchClear.addEventListener('click', function() {
  searchInput.value = '';
  state.searchQuery = '';
  searchClear.classList.remove('visible');
  searchInput.focus();
  renderTasks();
});

// sort select
sortSelect.addEventListener('change', function() {
  state.sortBy = sortSelect.value;
  renderTasks();
});

// sidebar status filter buttons
document.querySelectorAll('[data-filter-status]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('[data-filter-status]').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    state.filterStatus = btn.dataset.filterStatus;
    updatePageTitle();
    renderTasks();
    if (window.innerWidth <= 900) closeSidebar();
  });
});

// sidebar category filter buttons
document.querySelectorAll('[data-filter-category]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('[data-filter-category]').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    state.filterCategory = btn.dataset.filterCategory;
    updatePageTitle();
    renderTasks();
    if (window.innerWidth <= 900) closeSidebar();
  });
});

// sidebar toggle
hamburger.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

// theme toggle
themeToggle.addEventListener('click', function() {
  let current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// character counter for title input
taskTitle.addEventListener('input', function() {
  charCount.textContent = taskTitle.value.length + '/80';
});

// keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (confirmModal.classList.contains('active')) { closeConfirm(); return; }
    if (taskModal.classList.contains('active')) { closeModal(); return; }
    if (sidebar.classList.contains('open')) { closeSidebar(); return; }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && taskModal.classList.contains('active')) {
    saveTask();
  }
});

// press enter in title to save
taskTitle.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') saveTask();
});

// init - load data and render
function init() {
  loadTasks();
  loadTheme();
  renderTasks();
}

init();
