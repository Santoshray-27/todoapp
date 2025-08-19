// DOM Elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const themeToggle = document.getElementById('themeToggle');
const filterButtons = document.querySelectorAll('.filter-btn');
const prioritySelect = document.getElementById('prioritySelect');
const searchInput = document.getElementById('searchInput');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const sortSelect = document.getElementById('sortSelect');
const confirmDelete = document.getElementById('confirmDelete');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

// State management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentSearch = '';
let dragSrcElement = null;

// Initialize the app
function init() {
    renderTasks();
    updateTaskCount();

    // Load theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Load settings
    const settings = JSON.parse(localStorage.getItem('settings')) || {};
    if (settings.sortBy) sortSelect.value = settings.sortBy;
    if (settings.confirmDelete !== undefined) confirmDelete.checked = settings.confirmDelete;
}

// Add task
function addTask() {
    const text = taskInput.value.trim();
    if (text === '') return;

    const newTask = {
        id: Date.now(),
        text,
        priority: prioritySelect.value,
        completed: false,
        timestamp: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateTaskCount();

    taskInput.value = '';
    taskInput.focus();

    // Add animation class to new task
    const newTaskElement = document.querySelector(`[data-id="${newTask.id}"]`);
    if (newTaskElement) {
        newTaskElement.classList.add('task-item-enter');
        setTimeout(() => {
            newTaskElement.classList.remove('task-item-enter');
        }, 300);
    }
}

// Edit task
function editTask(id, newText) {
    if (newText.trim() === '') return;

    tasks = tasks.map(task =>
        task.id === id ? { ...task, text: newText } : task
    );

    saveTasks();
    renderTasks();
}

// Delete task
function deleteTask(id) {
    if (confirmDelete.checked && !confirm('Are you sure you want to delete this task?')) {
        return;
    }

    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('task-item-exit');
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateTaskCount();
        }, 300);
    } else {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
}

// Toggle task completion
function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
    );

    saveTasks();

    // Add completion animation
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('task-complete-animation');
        setTimeout(() => {
            taskElement.classList.remove('task-complete-animation');
        }, 500);
    }

    renderTasks();
    updateTaskCount();
}

// Filter tasks
function filterTasks(filter) {
    currentFilter = filter;
    filterButtons.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Save settings to localStorage
function saveSettings() {
    const settings = {
        sortBy: sortSelect.value,
        confirmDelete: confirmDelete.checked
    };
    localStorage.setItem('settings', JSON.stringify(settings));
}

// Update task count display
function updateTaskCount() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const activeTasks = totalTasks - completedTasks;

    taskCount.textContent = `${activeTasks} active, ${completedTasks} completed, ${totalTasks} total`;
}

// Render tasks based on current filter and search
function renderTasks() {
    // Filter tasks
    let filteredTasks = tasks.filter(task => {
        const matchesFilter = currentFilter === 'all' ||
            (currentFilter === 'active' && !task.completed) ||
            (currentFilter === 'completed' && task.completed);

        const matchesSearch = task.text.toLowerCase().includes(currentSearch.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    // Sort tasks
    const sortBy = sortSelect.value;
    filteredTasks.sort((a, b) => {
        if (sortBy === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (sortBy === 'alphabetical') {
            return a.text.localeCompare(b.text);
        } else {
            return new Date(b.timestamp) - new Date(a.timestamp);
        }
    });

    // Render tasks or empty state
    if (filteredTasks.length === 0) {
        const emptyState = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No tasks found</h3>
                        <p>${currentSearch ? 'Try a different search term' : 'Add a task to get started!'}</p>
                    </div>
                `;
        taskList.innerHTML = emptyState;
        return;
    }

    // Create task items
    taskList.innerHTML = filteredTasks.map(task => {
        const date = new Date(task.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
                    <div class="task-item" draggable="true" data-id="${task.id}">
                        <div class="task-drag-handle">
                            <i class="fas fa-grip-lines"></i>
                        </div>
                        <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
                        <div class="task-content">
                            <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                            <div class="task-meta">
                                <span class="task-priority priority-${task.priority}">
                                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                                </span>
                                <span class="task-date">
                                    <i class="far fa-clock"></i> ${formattedDate}
                                </span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="action-btn edit-btn" data-id="${task.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" data-id="${task.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
    }).join('');

    // Add event listeners for the new elements
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            toggleTask(id);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const task = tasks.find(task => task.id === id);

            const newText = prompt('Edit your task:', task.text);
            if (newText !== null) {
                editTask(id, newText);
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            deleteTask(id);
        });
    });

    // Setup drag and drop
    setupDragAndDrop();
}

// Drag and drop functionality
function setupDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');

    taskItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    dragSrcElement = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (dragSrcElement !== this) {
        const dragId = parseInt(dragSrcElement.dataset.id);
        const dropId = parseInt(this.dataset.id);

        // Get task objects
        const dragTask = tasks.find(task => task.id === dragId);
        const dropTask = tasks.find(task => task.id === dropId);

        // Get their indices
        const dragIndex = tasks.indexOf(dragTask);
        const dropIndex = tasks.indexOf(dropTask);

        // Remove dragged task
        tasks.splice(dragIndex, 1);
        // Insert it at the drop index
        tasks.splice(dropIndex, 0, dragTask);

        saveTasks();
        renderTasks();
    }

    return false;
}

function handleDragEnd(e) {
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('dragging');
        item.classList.remove('drag-over');
    });
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');

    if (document.body.classList.contains('dark-theme')) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    }
}

// Toggle settings panel
function toggleSettings() {
    settingsPanel.classList.toggle('open');
}

// Clear completed tasks
function clearCompleted() {
    if (confirm('Are you sure you want to delete all completed tasks?')) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
}

// Event listeners
addTaskBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

themeToggle.addEventListener('click', toggleTheme);

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterTasks(button.dataset.filter);
    });
});

searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderTasks();
});

settingsBtn.addEventListener('click', toggleSettings);

sortSelect.addEventListener('change', () => {
    saveSettings();
    renderTasks();
});

confirmDelete.addEventListener('change', saveSettings);

clearCompletedBtn.addEventListener('click', clearCompleted);

// Close settings panel when clicking outside
document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsPanel.classList.remove('open');
    }
});

// Initialize the app
init();