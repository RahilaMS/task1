const fs = require('fs');
const path = require('path');

// Read the HTML layout for DOM test setup
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

describe('AeroTask - To-Do List Application', () => {
  let app;

  beforeEach(() => {
    // 1. Set up the JSDOM document body
    document.documentElement.innerHTML = html.toString();
    
    // Mock window.lucide to avoid external call errors
    window.lucide = {
      createIcons: jest.fn()
    };

    // 2. Clear localStorage
    localStorage.clear();

    // 3. Reset Jest modules and import app.js
    jest.resetModules();
    app = require('./app.js');

    // 4. Dispatch DOMContentLoaded to trigger initApp
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
  });

  test('should load default tasks if localStorage is empty', () => {
    // The initApp should load 3 demo tasks when localStorage is empty
    const currentTodos = app.todos();
    expect(currentTodos).toHaveLength(3);
    expect(currentTodos[0].title).toBe('Welcome to AeroTask! 🚀');
    
    // Check if tasks are rendered in the DOM
    const listItems = document.querySelectorAll('.task-item');
    expect(listItems).toHaveLength(3);
  });

  test('should add a new task successfully', () => {
    // Fill the inputs
    const taskInput = document.getElementById('task-input');
    const categorySelect = document.getElementById('category-select');
    const prioritySelect = document.getElementById('priority-select');
    const dueDateInput = document.getElementById('due-date');
    const todoForm = document.getElementById('todo-form');

    taskInput.value = 'Test New Task';
    categorySelect.value = 'Work';
    prioritySelect.value = 'High';
    dueDateInput.value = '2026-12-31';

    // Submit form
    const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
    todoForm.dispatchEvent(submitEvent);

    // Verify state
    const currentTodos = app.todos();
    // 3 defaults + 1 new
    expect(currentTodos).toHaveLength(4);
    expect(currentTodos[0].title).toBe('Test New Task');
    expect(currentTodos[0].category).toBe('Work');
    expect(currentTodos[0].priority).toBe('High');
    expect(currentTodos[0].dueDate).toBe('2026-12-31');
    expect(currentTodos[0].completed).toBe(false);

    // Verify localStorage has updated
    const saved = JSON.parse(localStorage.getItem('aerotask_todos'));
    expect(saved).toHaveLength(4);
    expect(saved[0].title).toBe('Test New Task');

    // Verify DOM rendering
    const listItems = document.querySelectorAll('.task-item');
    expect(listItems).toHaveLength(4);
    expect(listItems[0].querySelector('.task-title').textContent).toBe('Test New Task');
  });

  test('should toggle task completion', () => {
    const currentTodos = app.todos();
    const targetTodo = currentTodos[0]; // Welcome to AeroTask! 🚀 (incomplete)
    expect(targetTodo.completed).toBe(false);

    // Find the checkbox in the DOM
    const taskElement = document.querySelector(`[data-id="${targetTodo.id}"]`);
    const checkbox = taskElement.querySelector('.task-check-input');

    // Check it
    checkbox.checked = true;
    checkbox.dispatchEvent(new window.Event('change'));

    // Verify state change
    expect(targetTodo.completed).toBe(true);
    
    // Fetch updated task element after re-render
    const updatedTaskElement = document.querySelector(`[data-id="${targetTodo.id}"]`);
    expect(updatedTaskElement.classList.contains('completed')).toBe(true);

    // Verify progress tracking stats update
    const progressText = document.getElementById('progress-percent').textContent;
    // 3 defaults: 1 completed, now 2 completed out of 3 total -> 67%
    expect(progressText).toBe('67%');
  });

  test('should edit a task title', () => {
    const currentTodos = app.todos();
    const targetTodo = currentTodos[0]; // Incomplete task
    
    // Simulate double click to edit
    const taskElement = document.querySelector(`[data-id="${targetTodo.id}"]`);
    const titleSpan = taskElement.querySelector('.task-title');
    
    titleSpan.dispatchEvent(new window.Event('dblclick'));

    // The span should be replaced by an input box
    const editInput = taskElement.querySelector('.task-edit-input');
    expect(editInput).not.toBeNull();
    expect(editInput.value).toBe(targetTodo.title);

    // Change value and trigger blur (save)
    editInput.value = 'Updated Task Title';
    editInput.dispatchEvent(new window.Event('blur'));

    // Verify state
    expect(targetTodo.title).toBe('Updated Task Title');

    // Verify DOM restoration on the updated task element
    const updatedTaskElement = document.querySelector(`[data-id="${targetTodo.id}"]`);
    const updatedTitleSpan = updatedTaskElement.querySelector('.task-title');
    expect(updatedTitleSpan).not.toBeNull();
    expect(updatedTitleSpan.textContent).toBe('Updated Task Title');
  });

  test('should delete a task with animation', () => {
    const currentTodos = app.todos();
    const targetTodo = currentTodos[0];
    const originalLength = currentTodos.length;

    const taskElement = document.querySelector(`[data-id="${targetTodo.id}"]`);
    const deleteBtn = taskElement.querySelector('.delete-btn');

    // Click delete
    deleteBtn.dispatchEvent(new window.Event('click'));

    // Verify that slide-out class is added first
    expect(taskElement.classList.contains('slide-out')).toBe(true);
    // Task shouldn't be deleted immediately (waiting for animationend)
    expect(app.todos()).toHaveLength(originalLength);

    // Trigger animation end
    taskElement.dispatchEvent(new window.Event('animationend'));

    // Verify deletion completed
    expect(app.todos()).toHaveLength(originalLength - 1);
    expect(document.querySelector(`[data-id="${targetTodo.id}"]`)).toBeNull();
  });

  test('should filter tasks by status tabs', () => {
    // Default todos: 2 active, 1 completed
    const allTab = document.querySelector('[data-filter="all"]');
    const activeTab = document.querySelector('[data-filter="active"]');
    const completedTab = document.querySelector('[data-filter="completed"]');

    // 1. Click Active
    activeTab.dispatchEvent(new window.Event('click'));
    expect(document.querySelectorAll('.task-item')).toHaveLength(2);

    // 2. Click Completed
    completedTab.dispatchEvent(new window.Event('click'));
    expect(document.querySelectorAll('.task-item')).toHaveLength(1);

    // 3. Click All
    allTab.dispatchEvent(new window.Event('click'));
    expect(document.querySelectorAll('.task-item')).toHaveLength(3);
  });

  test('should search tasks matching input', () => {
    const searchInput = document.getElementById('search-input');
    
    // Type in search box
    searchInput.value = 'statistics';
    searchInput.dispatchEvent(new window.Event('input'));

    // Only 1 default task contains "statistics"
    const listItems = document.querySelectorAll('.task-item');
    expect(listItems).toHaveLength(1);
    expect(listItems[0].querySelector('.task-title').textContent).toContain('statistics');
  });

  test('should sort tasks correctly', () => {
    // Add custom tasks to test priorities and due dates
    app.setTodos([
      {
        id: 101,
        title: 'Task A',
        completed: false,
        category: 'Personal',
        priority: 'Low',
        dueDate: '2026-07-15',
        dateCreated: 1000
      },
      {
        id: 102,
        title: 'Task B',
        completed: false,
        category: 'Work',
        priority: 'High',
        dueDate: '2026-06-25',
        dateCreated: 2000
      },
      {
        id: 103,
        title: 'Task C',
        completed: false,
        category: 'Personal',
        priority: 'Medium',
        dueDate: '',
        dateCreated: 3000
      }
    ]);

    const sortSelect = document.getElementById('sort-select');

    // Sort by Newest (dateCreated desc)
    sortSelect.value = 'dateCreated-desc';
    sortSelect.dispatchEvent(new window.Event('change'));
    let items = document.querySelectorAll('.task-item');
    expect(items[0].querySelector('.task-title').textContent).toBe('Task C');
    expect(items[2].querySelector('.task-title').textContent).toBe('Task A');

    // Sort by Oldest (dateCreated asc)
    sortSelect.value = 'dateCreated-asc';
    sortSelect.dispatchEvent(new window.Event('change'));
    items = document.querySelectorAll('.task-item');
    expect(items[0].querySelector('.task-title').textContent).toBe('Task A');
    expect(items[2].querySelector('.task-title').textContent).toBe('Task C');

    // Sort by Due Date Soonest (dueDate asc, blank items go last)
    sortSelect.value = 'dueDate-asc';
    sortSelect.dispatchEvent(new window.Event('change'));
    items = document.querySelectorAll('.task-item');
    expect(items[0].querySelector('.task-title').textContent).toBe('Task B'); // June 25
    expect(items[1].querySelector('.task-title').textContent).toBe('Task A'); // July 15
    expect(items[2].querySelector('.task-title').textContent).toBe('Task C'); // Blank

    // Sort by Priority (High -> Medium -> Low)
    sortSelect.value = 'priority-desc';
    sortSelect.dispatchEvent(new window.Event('change'));
    items = document.querySelectorAll('.task-item');
    expect(items[0].querySelector('.task-title').textContent).toBe('Task B'); // High
    expect(items[1].querySelector('.task-title').textContent).toBe('Task C'); // Medium
    expect(items[2].querySelector('.task-title').textContent).toBe('Task A'); // Low
  });

  test('should clear all completed tasks', () => {
    // 2 active, 1 completed
    const clearBtn = document.getElementById('clear-completed-btn');
    clearBtn.dispatchEvent(new window.Event('click'));

    // Get the element and trigger animationend to complete delete operation
    const completedItems = document.querySelectorAll('.task-item.completed');
    completedItems.forEach(el => {
      el.dispatchEvent(new window.Event('animationend'));
    });

    // Check state has only 2 active tasks remaining
    expect(app.todos()).toHaveLength(2);
    expect(app.todos().filter(t => t.completed)).toHaveLength(0);
  });
});
