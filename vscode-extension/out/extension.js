"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
// ─── State ────────────────────────────────────────────────────────────────────
let taskProvider;
let timeTracker;
let statusBarItem;
// ─── Activate ─────────────────────────────────────────────────────────────────
function activate(context) {
    console.log('Employee Tracker extension is now active!');
    // Status bar (shows active timer)
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'employeeTracker.showTimerMenu';
    context.subscriptions.push(statusBarItem);
    // Task tree view
    taskProvider = new TaskProvider(context);
    vscode.window.registerTreeDataProvider('employeeTrackerTasks', taskProvider);
    // Time tracker
    timeTracker = new TimeTracker(context);
    // ── Commands ──────────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('employeeTracker.refreshTasks', () => {
        taskProvider.refresh();
        vscode.window.showInformationMessage('Tasks refreshed!');
    }), vscode.commands.registerCommand('employeeTracker.login', async () => {
        await login(context);
    }), vscode.commands.registerCommand('employeeTracker.logout', async () => {
        await timeTracker.stopTracking();
        await context.globalState.update('authToken', undefined);
        await context.globalState.update('userEmail', undefined);
        taskProvider.refresh();
        statusBarItem.hide();
        vscode.window.showInformationMessage('Logged out successfully.');
    }), vscode.commands.registerCommand('employeeTracker.startTracking', async (task) => {
        await timeTracker.startTracking(task);
    }), vscode.commands.registerCommand('employeeTracker.stopTracking', async () => {
        await timeTracker.stopTracking();
    }), vscode.commands.registerCommand('employeeTracker.showTimerMenu', async () => {
        await showTimerMenu();
    }), vscode.commands.registerCommand('employeeTracker.markInProgress', async (task) => {
        await updateTaskStatus(context, task.taskId, 'in_progress');
        taskProvider.refresh();
    }), vscode.commands.registerCommand('employeeTracker.markCompleted', async (task) => {
        await timeTracker.stopTracking();
        await updateTaskStatus(context, task.taskId, 'completed');
        taskProvider.refresh();
    }), vscode.commands.registerCommand('employeeTracker.viewTaskDetail', async (task) => {
        showTaskDetail(task);
    }));
    // ── Activity listeners (auto start/stop timer) ────────────────────────────
    // Start timer when user types
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => {
        timeTracker.onActivity();
    }));
    // Start timer when user creates/saves a file
    context.subscriptions.push(vscode.workspace.onDidCreateFiles(() => { timeTracker.onActivity(); }), vscode.workspace.onDidSaveTextDocument(() => { timeTracker.onActivity(); }), vscode.workspace.onDidOpenTextDocument(() => { timeTracker.onActivity(); }));
    // Auto-refresh task list every 5 minutes
    const config = vscode.workspace.getConfiguration('employeeTracker');
    const refreshInterval = config.get('refreshInterval', 300000);
    setInterval(() => taskProvider.refresh(), refreshInterval);
    // Check login
    const token = context.globalState.get('authToken');
    if (!token) {
        vscode.window.showInformationMessage('Employee Tracker: Please login to view your tasks', 'Login').then(sel => {
            if (sel === 'Login') {
                vscode.commands.executeCommand('employeeTracker.login');
            }
        });
    }
    else {
        timeTracker.restoreActiveSession();
    }
}
exports.activate = activate;
// ─── Login ────────────────────────────────────────────────────────────────────
async function login(context) {
    const email = await vscode.window.showInputBox({
        prompt: 'Enter your Employee Tracker email',
        placeHolder: 'employee@example.com'
    });
    if (!email) {
        return;
    }
    const password = await vscode.window.showInputBox({
        prompt: 'Enter your password',
        password: true
    });
    if (!password) {
        return;
    }
    try {
        const apiUrl = getApiUrl();
        const response = await axios_1.default.post(`${apiUrl}/api/auth/login`, { email, password });
        const token = response.data.data.token;
        await context.globalState.update('authToken', token);
        await context.globalState.update('userEmail', email);
        vscode.window.showInformationMessage(`✅ Logged in as ${email}`);
        taskProvider.refresh();
    }
    catch (error) {
        vscode.window.showErrorMessage(`Login failed: ${error.response?.data?.message || error.message}`);
    }
}
// ─── Update task status ───────────────────────────────────────────────────────
async function updateTaskStatus(context, taskId, status) {
    const token = context.globalState.get('authToken');
    if (!token) {
        vscode.window.showErrorMessage('Please login first');
        return;
    }
    try {
        const apiUrl = getApiUrl();
        await axios_1.default.put(`${apiUrl}/api/tasks/${taskId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
        vscode.window.showInformationMessage(`Task marked as ${status.replace('_', ' ')}!`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to update task: ${error.response?.data?.message || error.message}`);
    }
}
// ─── Timer menu ───────────────────────────────────────────────────────────────
async function showTimerMenu() {
    const isTracking = timeTracker.isActive();
    const options = isTracking
        ? ['⏹ Stop Timer', '📋 View Active Task']
        : ['▶ Start Timer for a Task'];
    const choice = await vscode.window.showQuickPick(options, { placeHolder: 'Time Tracker' });
    if (!choice) {
        return;
    }
    if (choice.startsWith('⏹')) {
        await timeTracker.stopTracking();
    }
    else if (choice.startsWith('▶')) {
        taskProvider.promptStartTracking();
    }
}
// ─── Task detail webview ──────────────────────────────────────────────────────
function showTaskDetail(task) {
    const panel = vscode.window.createWebviewPanel('taskDetail', task.label, vscode.ViewColumn.One, {});
    panel.webview.html = `
        <!DOCTYPE html><html><head><style>
        body{padding:24px;font-family:Arial,sans-serif;background:#1e1e1e;color:#d4d4d4}
        h1{color:#4fc3f7;font-size:20px}
        .badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:12px;font-weight:600}
        .pending{background:#fff3cd;color:#856404}
        .in_progress{background:#cfe2ff;color:#084298}
        .completed{background:#d1e7dd;color:#0f5132}
        .row{margin:12px 0}.label{color:#9e9e9e;font-size:12px;text-transform:uppercase}
        .value{font-size:15px;margin-top:4px}
        </style></head><body>
        <h1>${task.label}</h1>
        <div class="row"><div class="label">Status</div>
          <div class="value"><span class="badge ${task.status}">${task.status.replace('_', ' ')}</span></div></div>
        <div class="row"><div class="label">Deadline</div>
          <div class="value">${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</div></div>
        <div class="row"><div class="label">Description</div>
          <div class="value">${task.description || 'No description'}</div></div>
        </body></html>`;
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getApiUrl() {
    return vscode.workspace.getConfiguration('employeeTracker').get('apiUrl', 'http://localhost:5000');
}
function getToken(context) {
    return context.globalState.get('authToken');
}
// ─── TimeTracker class ────────────────────────────────────────────────────────
class TimeTracker {
    constructor(context) {
        this.context = context;
        this.sessionId = null;
        this.taskId = null;
        this.taskTitle = null;
        this.activeSeconds = 0;
        this.lastActivityTime = 0;
        this.idleTimeoutMs = 5 * 60 * 1000; // 5 minutes
        this.heartbeatInterval = null;
        this.idleCheckInterval = null;
        this.isIdle = false;
        this.trackingStartTime = 0;
    }
    // Called on every keystroke / file event
    onActivity() {
        const now = Date.now();
        // If we have an active task selected but session not started yet, start it
        if (!this.sessionId && this.taskId) {
            this.beginSession();
            return;
        }
        if (!this.sessionId) {
            return;
        }
        // Resume from idle
        if (this.isIdle) {
            this.isIdle = false;
            this.updateStatusBar();
            vscode.window.setStatusBarMessage('⏱ Timer resumed', 3000);
        }
        this.lastActivityTime = now;
    }
    // Start tracking a specific task
    async startTracking(task) {
        const token = getToken(this.context);
        if (!token) {
            vscode.window.showErrorMessage('Please login first');
            return;
        }
        // Stop any existing session
        if (this.sessionId) {
            await this.stopTracking();
        }
        this.taskId = task.taskId;
        this.taskTitle = task.label;
        await this.beginSession();
    }
    async beginSession() {
        const token = getToken(this.context);
        if (!token || !this.taskId) {
            return;
        }
        try {
            const apiUrl = getApiUrl();
            // Start the time session
            const response = await axios_1.default.post(`${apiUrl}/api/time-tracking/sessions/start`, { task_id: this.taskId }, { headers: { Authorization: `Bearer ${token}` } });
            this.sessionId = String(response.data.data.id);
            this.activeSeconds = 0;
            this.lastActivityTime = Date.now();
            this.trackingStartTime = Date.now();
            this.isIdle = false;
            // Auto-change task status: pending → in_progress when work starts
            try {
                const taskRes = await axios_1.default.get(`${apiUrl}/api/tasks/${this.taskId}`, { headers: { Authorization: `Bearer ${token}` } });
                const currentStatus = taskRes.data.data?.status;
                if (currentStatus === 'pending') {
                    await axios_1.default.put(`${apiUrl}/api/tasks/${this.taskId}`, { status: 'in_progress' }, { headers: { Authorization: `Bearer ${token}` } });
                    vscode.window.showInformationMessage(`⏱ Timer started! "${this.taskTitle}" → In Progress`);
                    taskProvider.refresh();
                }
                else {
                    vscode.window.showInformationMessage(`⏱ Timer started for: ${this.taskTitle}`);
                }
            }
            catch {
                vscode.window.showInformationMessage(`⏱ Timer started for: ${this.taskTitle}`);
            }
            this.startHeartbeat();
            this.startIdleCheck();
            this.updateStatusBar();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start timer: ${error.response?.data?.message || error.message}`);
        }
    }
    // Stop tracking
    async stopTracking() {
        if (!this.sessionId) {
            return;
        }
        this.stopHeartbeat();
        this.stopIdleCheck();
        const token = getToken(this.context);
        if (token) {
            try {
                const apiUrl = getApiUrl();
                await axios_1.default.post(`${apiUrl}/api/time-tracking/sessions/stop`, { session_id: this.sessionId, active_seconds: this.activeSeconds }, { headers: { Authorization: `Bearer ${token}` } });
                const hours = (this.activeSeconds / 3600).toFixed(2);
                vscode.window.showInformationMessage(`⏹ Timer stopped. Active time: ${this.formatTime(this.activeSeconds)} (${hours}h)`);
            }
            catch (error) {
                console.error('Failed to stop session:', error.message);
            }
        }
        this.sessionId = null;
        this.taskId = null;
        this.taskTitle = null;
        this.activeSeconds = 0;
        statusBarItem.hide();
    }
    // Restore session if VS Code was reopened
    async restoreActiveSession() {
        const token = getToken(this.context);
        if (!token) {
            return;
        }
        try {
            const apiUrl = getApiUrl();
            const response = await axios_1.default.get(`${apiUrl}/api/time-tracking/sessions/active`, { headers: { Authorization: `Bearer ${token}` } });
            const session = response.data.data;
            if (session) {
                this.sessionId = String(session.id);
                this.taskId = String(session.task_id);
                this.taskTitle = session.task?.title || 'Unknown Task';
                this.activeSeconds = session.active_time || 0;
                this.lastActivityTime = Date.now();
                this.trackingStartTime = Date.now();
                this.isIdle = false;
                this.startHeartbeat();
                this.startIdleCheck();
                this.updateStatusBar();
            }
        }
        catch {
            // No active session, that's fine
        }
    }
    isActive() {
        return this.sessionId !== null;
    }
    // ── Heartbeat: send active time to server every 30s ──────────────────────
    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            if (!this.sessionId || this.isIdle) {
                return;
            }
            // Count active seconds (time since last activity check)
            const now = Date.now();
            const timeSinceActivity = now - this.lastActivityTime;
            // Only count as active if user was active in last 30s
            if (timeSinceActivity < 30000) {
                this.activeSeconds += 30;
            }
            const token = getToken(this.context);
            if (!token) {
                return;
            }
            try {
                const apiUrl = getApiUrl();
                await axios_1.default.post(`${apiUrl}/api/time-tracking/sessions/heartbeat`, { session_id: this.sessionId, active_seconds: this.activeSeconds }, { headers: { Authorization: `Bearer ${token}` } });
                this.updateStatusBar();
            }
            catch (error) {
                if (error.response?.status === 404) {
                    // Session ended externally
                    this.sessionId = null;
                    statusBarItem.hide();
                }
            }
        }, 30000); // every 30 seconds
    }
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    // ── Idle check: detect 5 min of no activity ───────────────────────────────
    startIdleCheck() {
        this.idleCheckInterval = setInterval(() => {
            if (!this.sessionId) {
                return;
            }
            const now = Date.now();
            const idleMs = now - this.lastActivityTime;
            if (idleMs >= this.idleTimeoutMs && !this.isIdle) {
                this.isIdle = true;
                this.updateStatusBar();
                vscode.window.setStatusBarMessage('⏸ Timer paused (idle for 5 min)', 5000);
            }
        }, 30000); // check every 30 seconds
    }
    stopIdleCheck() {
        if (this.idleCheckInterval) {
            clearInterval(this.idleCheckInterval);
            this.idleCheckInterval = null;
        }
    }
    // ── Status bar ────────────────────────────────────────────────────────────
    updateStatusBar() {
        if (!this.sessionId) {
            statusBarItem.hide();
            return;
        }
        const timeStr = this.formatTime(this.activeSeconds);
        const icon = this.isIdle ? '⏸' : '⏱';
        const idleNote = this.isIdle ? ' (paused)' : '';
        statusBarItem.text = `${icon} ${this.taskTitle?.substring(0, 20)}: ${timeStr}${idleNote}`;
        statusBarItem.tooltip = `Task: ${this.taskTitle}\nActive time: ${timeStr}\nClick to manage timer`;
        statusBarItem.show();
    }
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${h}h ${m}m`;
        }
        if (m > 0) {
            return `${m}m ${s}s`;
        }
        return `${s}s`;
    }
}
// ─── TaskProvider ─────────────────────────────────────────────────────────────
class TaskProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }
    async getChildren(element) {
        if (element) {
            return [];
        }
        const token = getToken(this.context);
        if (!token) {
            return [new TaskItem('🔐 Please login to view tasks', '', '', '', '', 'info')];
        }
        try {
            const apiUrl = getApiUrl();
            const response = await axios_1.default.get(`${apiUrl}/api/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const tasks = response.data.data.tasks;
            if (!tasks || tasks.length === 0) {
                return [new TaskItem('✅ No tasks assigned', '', '', '', '', 'info')];
            }
            return tasks.map((task) => new TaskItem(task.title, String(task.id), task.status, task.deadline, task.description || '', `task-${task.status}`));
        }
        catch (error) {
            if (error.response?.status === 401) {
                await this.context.globalState.update('authToken', undefined);
                vscode.window.showErrorMessage('Session expired. Please login again.');
            }
            return [new TaskItem('❌ Failed to load tasks', '', '', '', '', 'error')];
        }
    }
    // Prompt user to pick a task and start tracking
    async promptStartTracking() {
        const token = getToken(this.context);
        if (!token) {
            vscode.window.showErrorMessage('Please login first');
            return;
        }
        try {
            const apiUrl = getApiUrl();
            const response = await axios_1.default.get(`${apiUrl}/api/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const tasks = response.data.data.tasks.filter((t) => t.status !== 'completed');
            if (!tasks.length) {
                vscode.window.showInformationMessage('No active tasks to track.');
                return;
            }
            // Build a map so we can look up the TaskItem after picking
            const taskMap = new Map();
            const items = tasks.map((t) => {
                const item = new TaskItem(t.title, String(t.id), t.status, t.deadline, t.description || '', `task-${t.status}`);
                taskMap.set(t.title, item);
                return {
                    label: t.title,
                    description: `[${t.status}] Due: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'}`
                };
            });
            const picked = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a task to start tracking time'
            });
            if (picked) {
                const taskItem = taskMap.get(picked.label);
                if (taskItem) {
                    await timeTracker.startTracking(taskItem);
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to load tasks');
        }
    }
}
// ─── TaskItem ─────────────────────────────────────────────────────────────────
class TaskItem extends vscode.TreeItem {
    constructor(label, taskId, status, deadline, description, contextValue) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.taskId = taskId;
        this.status = status;
        this.deadline = deadline;
        this.description = description;
        this.contextValue = contextValue;
        this.tooltip = `${label}\nStatus: ${status}${deadline ? '\nDue: ' + new Date(deadline).toLocaleDateString() : ''}`;
        this.description = deadline ? `Due: ${new Date(deadline).toLocaleDateString()}` : '';
        if (status === 'completed') {
            this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
        }
        else if (status === 'in_progress') {
            this.iconPath = new vscode.ThemeIcon('sync', new vscode.ThemeColor('testing.iconQueued'));
        }
        else if (status === 'pending') {
            this.iconPath = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconUnset'));
        }
        else {
            this.iconPath = new vscode.ThemeIcon('info');
        }
    }
}
function deactivate() {
    if (timeTracker) {
        timeTracker.stopTracking();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map