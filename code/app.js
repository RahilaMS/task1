/**
 * AeroTask - Premium Focus Hub Logic
 */

// Application State
let todos = [];
let currentFilter = 'all';

// DOM Selectors
const todoForm = document.getElementById('todo-form');
const taskInput = document.getElementById('task-input');
const categorySelect = document.getElementById('category-select');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date');
const searchInput = document.getElementById('search-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const filterTabs = document.querySelectorAll('.filter-tab');
const sortSelect = document.getElementById('sort-select');
const activeCount = document.getElementById('active-tasks-count');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const tasksCountStatus = document.getElementById('tasks-count-status');
const greetingMsg = document.getElementById('greeting-msg');
const currentDateEl = document.getElementById('current-date');
const toastContainer = document.getElementById('toast-container');

// Priority Mapping for sorting
const priorityWeight = {
  High: 3,
  Medium: 2,
  Low: 1
};

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Set date and greeting
  updateGreeting();
  
  // Load tasks from localStorage
  loadFromLocalStorage();
  
  // Set default due date to tomorrow or keep empty
  // Let's keep empty so it's optional, but we can set placeholder
  
  // Attach Event Listeners
  if (todoForm) todoForm.addEventListener('submit', handleFormSubmit);
  if (searchInput) searchInput.addEventListener('input', handleSearch);
  if (sortSelect) sortSelect.addEventListener('change', renderTodos);
  if (clearCompletedBtn) clearCompletedBtn.addEventListener('click', clearCompleted);
  
  filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      filterTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.getAttribute('data-filter');
      renderTodos();
    });
  });

  renderTodos();
}

/* ==========================================================================
   Date & Greeting Helpers
   ========================================================================== */
function updateGreeting() {
  const now = new Date();
  const hours = now.getHours();
  let greeting = 'Good evening';
  
  if (hours < 12) {
    greeting = 'Good morning';
  } else if (hours < 18) {
    greeting = 'Good afternoon';
  }
  
  if (greetingMsg) {
    greetingMsg.textContent = `${greeting}, User!`;
  }
  
  if (currentDateEl) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('en-US', options);
  }
}

/* ==========================================================================
   State & Local Storage Operations
   ========================================================================== */
function saveToLocalStorage() {
  localStorage.setItem('aerotask_todos', JSON.stringify(todos));
}

function loadFromLocalStorage() {
  const stored = localStorage.getItem('aerotask_todos');
  if (stored) {
    try {
      todos = JSON.parse(stored);
    } catch (e) {
      todos = [];
      showToast('Error loading saved tasks.', 'danger');
    }
  } else {
    // Demo tasks for a gorgeous first impression if empty
    todos = [
      {
        id: 1,
        title: 'Welcome to AeroTask! 🚀',
        completed: false,
        category: 'Personal',
        priority: 'High',
        dueDate: new Date().toISOString().split('T')[0],
        dateCreated: Date.now() - 10000
      },
      {
        id: 2,
        title: 'Check out the category filters below 💡',
        completed: false,
        category: 'Work',
        priority: 'Medium',
        dueDate: '',
        dateCreated: Date.now() - 5000
      },
      {
        id: 3,
        title: 'Explore completed tasks statistics 📈',
        completed: true,
        category: 'Wellness',
        priority: 'Low',
        dueDate: '',
        dateCreated: Date.now()
      }
    ];
    saveToLocalStorage();
  }
}

/* ==========================================================================
   Core Task Operations (CRUD)
   ========================================================================== */
function handleFormSubmit(e) {
  e.preventDefault();
  
  const title = taskInput.value.trim();
  if (!title) return;
  
  const category = categorySelect.value;
  const priority = prioritySelect.value;
  const dueDate = dueDateInput.value;
  
  addTodo(title, category, priority, dueDate);
  
  // Reset Form
  taskInput.value = '';
  dueDateInput.value = '';
  categorySelect.value = 'Personal';
  prioritySelect.value = 'Medium';
}

function addTodo(title, category, priority, dueDate) {
  const newTodo = {
    id: Date.now(),
    title,
    completed: false,
    category,
    priority,
    dueDate,
    dateCreated: Date.now()
  };
  
  todos.unshift(newTodo);
  saveToLocalStorage();
  renderTodos();
  
  showToast(`Added: "${title.length > 20 ? title.substring(0, 20) + '...' : title}"`, 'success');
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveToLocalStorage();
    renderTodos();
    
    if (todo.completed) {
      showToast('Task completed! Keep it up.', 'success');
    }
  }
}

function editTodo(id, newTitle) {
  const trimmed = newTitle.trim();
  if (!trimmed) {
    deleteTodo(id);
    return;
  }
  
  const todo = todos.find(t => t.id === id);
  if (todo) {
    const oldTitle = todo.title;
    todo.title = trimmed;
    saveToLocalStorage();
    renderTodos();
    
    if (oldTitle !== trimmed) {
      showToast('Task updated successfully.', 'info');
    }
  }
}

function deleteTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  
  const taskElement = document.querySelector(`[data-id="${id}"]`);
  
  if (taskElement) {
    // Add deletion slide-out animation class
    taskElement.classList.add('slide-out');
    
    // Wait for animation to finish, then update state and DOM
    taskElement.addEventListener('animationend', () => {
      todos = todos.filter(t => t.id !== id);
      saveToLocalStorage();
      renderTodos();
      showToast('Task deleted.', 'danger');
    }, { once: true });
  } else {
    // Fallback if element is not in DOM
    todos = todos.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTodos();
    showToast('Task deleted.', 'danger');
  }
}

function clearCompleted() {
  const completedCount = todos.filter(t => t.completed).length;
  if (completedCount === 0) {
    showToast('No completed tasks to clear.', 'info');
    return;
  }
  
  // Transition all completed elements in DOM if visible
  const completedElements = document.querySelectorAll('.task-item.completed');
  if (completedElements.length > 0) {
    let animCount = 0;
    completedElements.forEach(el => {
      el.classList.add('slide-out');
      el.addEventListener('animationend', () => {
        animCount++;
        if (animCount === completedElements.length) {
          todos = todos.filter(t => !t.completed);
          saveToLocalStorage();
          renderTodos();
          showToast(`Cleared ${completedCount} completed task(s).`, 'danger');
        }
      }, { once: true });
    });
  } else {
    todos = todos.filter(t => !t.completed);
    saveToLocalStorage();
    renderTodos();
    showToast(`Cleared ${completedCount} completed task(s).`, 'danger');
  }
}

/* ==========================================================================
   Filtering & Sorting Engine
   ========================================================================== */
function handleSearch() {
  renderTodos();
}

function getFilteredAndSortedTodos() {
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  // 1. Filter
  let filtered = todos.filter(todo => {
    // Status Filter
    const matchesFilter = 
      currentFilter === 'all' || 
      (currentFilter === 'active' && !todo.completed) || 
      (currentFilter === 'completed' && todo.completed);
      
    // Search Filter
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery);
    
    return matchesFilter && matchesSearch;
  });
  
  // 2. Sort
  const sortOption = sortSelect ? sortSelect.value : 'dateCreated-desc';
  
  filtered.sort((a, b) => {
    switch (sortOption) {
      case 'dateCreated-asc':
        return a.dateCreated - b.dateCreated;
      case 'dateCreated-desc':
        return b.dateCreated - a.dateCreated;
      case 'dueDate-asc':
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      case 'priority-desc':
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      default:
        return b.dateCreated - a.dateCreated;
    }
  });
  
  return filtered;
}

/* ==========================================================================
   UI Render Engine
   ========================================================================== */
function renderTodos() {
  const visibleTodos = getFilteredAndSortedTodos();
  
  if (!todoList) return;
  
  todoList.innerHTML = '';
  
  if (visibleTodos.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    
    visibleTodos.forEach(todo => {
      const li = createTaskElement(todo);
      todoList.appendChild(li);
    });
  }
  
  // Refresh Lucide Icons for dynamic content
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  updateProgress();
}

function createTaskElement(todo) {
  const li = document.createElement('li');
  li.className = `task-item ${todo.completed ? 'completed' : ''}`;
  li.setAttribute('data-id', todo.id);
  
  // Category class helper
  const catClass = `cat-${todo.category.toLowerCase()}`;
  
  // Due date text helper
  let dueDateText = '';
  if (todo.dueDate) {
    const d = new Date(todo.dueDate);
    dueDateText = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // HTML content build
  li.innerHTML = `
    <div class="task-left-section">
      <label class="checkbox-container">
        <input type="checkbox" ${todo.completed ? 'checked' : ''} class="task-check-input">
        <span class="checkmark">
          <i data-lucide="check"></i>
        </span>
      </label>
      
      <div class="task-details">
        <div class="task-title-group">
          <span class="task-title">${escapeHTML(todo.title)}</span>
          <span class="task-category ${catClass}">${todo.category}</span>
        </div>
        
        <div class="task-sub-meta">
          ${todo.dueDate ? `
            <div class="meta-item">
              <i data-lucide="calendar"></i>
              <span>${dueDateText}</span>
            </div>
          ` : ''}
          <div class="meta-item">
            <span class="priority-pill ${todo.priority.toLowerCase()}">${todo.priority}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="task-actions">
      <button class="btn-icon edit-btn" aria-label="Edit task">
        <i data-lucide="edit-3"></i>
      </button>
      <button class="btn-icon delete-btn" aria-label="Delete task">
        <i data-lucide="trash"></i>
      </button>
    </div>
  `;

  // Attach Event listeners to dynamic elements
  
  // Checkbox complete toggle
  const checkInput = li.querySelector('.task-check-input');
  checkInput.addEventListener('change', () => toggleTodo(todo.id));
  
  // Delete action
  const deleteBtn = li.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
  
  // Edit action (Double click title OR click edit button)
  const editBtn = li.querySelector('.edit-btn');
  const taskTitleEl = li.querySelector('.task-title');
  
  const startEdit = () => {
    if (todo.completed) return; // Can't edit completed tasks
    
    const currentTitle = todo.title;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = currentTitle;
    
    // Replace text element with input
    taskTitleEl.replaceWith(input);
    input.focus();
    
    // Select all text in input
    input.select();
    
    // Close/save handlers
    const finishEdit = () => {
      const newValue = input.value.trim();
      input.replaceWith(taskTitleEl);
      if (newValue !== currentTitle) {
        editTodo(todo.id, newValue);
      }
    };
    
    input.addEventListener('blur', finishEdit);
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        finishEdit();
      } else if (e.key === 'Escape') {
        input.replaceWith(taskTitleEl); // Revert with no save
      }
    });
  };

  editBtn.addEventListener('click', startEdit);
  taskTitleEl.addEventListener('dblclick', startEdit);

  return li;
}

/* ==========================================================================
   Progress Updates Calculations
   ========================================================================== */
function updateProgress() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const active = total - completed;
  
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  if (progressPercent) progressPercent.textContent = `${percentage}%`;
  if (progressFill) progressFill.style.width = `${percentage}%`;
  
  if (tasksCountStatus) {
    tasksCountStatus.textContent = `${completed} of ${total} tasks completed`;
  }
  
  if (activeCount) {
    activeCount.textContent = `${active} active task${active !== 1 ? 's' : ''} remaining`;
  }
}

/* ==========================================================================
   Toast Notification Generator
   ========================================================================== */
function showToast(message, type = 'info') {
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'danger') iconName = 'alert-triangle';
  
  toast.innerHTML = `
    <div class="toast-icon-box">
      <i data-lucide="${iconName}"></i>
    </div>
    <div class="toast-message">${escapeHTML(message)}</div>
    <button class="toast-close" aria-label="Close notification">
      <i data-lucide="x"></i>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Close triggers
  const closeBtn = toast.querySelector('.toast-close');
  const closeToast = () => {
    toast.classList.add('toast-out');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  };
  
  closeBtn.addEventListener('click', closeToast);
  
  // Auto dismiss after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      closeToast();
    }
  }, 3500);
}

/* ==========================================================================
   Utility Helpers
   ========================================================================== */
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Module exports for Jest Testing Environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    todos: () => todos,
    setTodos: (newTodos) => { todos = newTodos; },
    getFilter: () => currentFilter,
    setFilter: (f) => { currentFilter = f; },
    initApp,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    clearCompleted,
    getFilteredAndSortedTodos,
    renderTodos,
    updateProgress,
    saveToLocalStorage,
    loadFromLocalStorage,
    showToast,
    escapeHTML
  };
}
