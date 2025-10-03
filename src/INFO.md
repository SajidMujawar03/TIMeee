# TIMeee Extension: Detailed Function Explanations

This document provides a **line-by-line breakdown** of all core functions in the TIMeee VS Code extension. TIMeee is a Pomodoro timer that integrates a status bar display, webview control panel, and persistent state management. These explanations cover the **entry point**, **timer logic**, **controls**, **UI updates**, **state persistence**, **cleanup**, and **webview content generation**.

Each section includes:
- **Function Overview**: Purpose and parameters.
- **Line-by-Line Breakdown**: Key code snippets with explanations.
- **Summary**: Key takeaways and interactions.

---

## 1. `activate` Function

### Function Overview
```ts
export function activate(context: vscode.ExtensionContext) { ... }
```
- **Purpose**: Entry point called automatically by VS Code when the extension loads. Sets up state restoration, status bar, auto-resume, and the webview control panel.
- **Parameters**: `context` – VS Code's extension lifecycle object for state, commands, and cleanup.

### Line-by-Line Breakdown

1. **Restore Previous State or Set Defaults**
   ```ts
   WORK_DURATION = context.globalState.get("WORK_DURATION", 25 * 60);
   BREAK_DURATION = context.globalState.get("BREAK_DURATION", 5 * 60);
   secondsLeft = context.globalState.get("secondsLeft", WORK_DURATION);
   isWork = context.globalState.get("isWork", true);
   paused = context.globalState.get("paused", false);
   ```
   - Retrieves stored values from `globalState`; defaults to 25-min work, 5-min break, full work time left, work session, not paused.

2. **Create the Status Bar Item**
   ```ts
   const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
   statusBarItem.tooltip = "Click to open TIMeee Control Panel";
   statusBarItem.command = "timeee.openControlPanel";
   statusBarItem.show();
   context.subscriptions.push(statusBarItem);
   ```
   - Creates a right-aligned status bar item (priority 100); adds tooltip and click command; shows it and registers for cleanup.

3. **Update Status Bar Immediately**
   ```ts
   updateStatusBar(statusBarItem);
   ```
   - Displays initial timer state.

4. **Auto-Start Timer if Not Paused**
   ```ts
   if (!paused) {
     startTIMeee(context, statusBarItem, true);
   }
   ```
   - Resumes timer in resume mode if previously running.

5. **Register the Control Panel Command**
   ```ts
   const controlPanelCommand = vscode.commands.registerCommand("timeee.openControlPanel", () => { ... });
   context.subscriptions.push(controlPanelCommand);
   ```
   - Registers command for status bar clicks or Command Palette; handles panel creation/reuse.

6. **Check if Panel Already Exists**
   ```ts
   if (controlPanel) {
     controlPanel.reveal(vscode.ViewColumn.Beside, true);
     return;
   }
   ```
   - Reuses existing panel to avoid duplicates.

7. **Create the Webview Panel**
   ```ts
   controlPanel = vscode.window.createWebviewPanel("timeeeControl", "TIMeee Control", { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, { enableScripts: true, retainContextWhenHidden: true });
   ```
   - Creates panel beside editor; enables JS and state retention.

8. **Set the Panel Icon**
   ```ts
   controlPanel.iconPath = vscode.Uri.file(context.asAbsolutePath("media/timee.svg"));
   ```
   - Loads custom SVG icon.

9. **Load HTML Content**
   ```ts
   controlPanel.webview.html = getControlPanelContent();
   ```
   - Injects UI HTML/CSS/JS.

10. **Handle Messages from Webview**
    ```ts
    controlPanel.webview.onDidReceiveMessage((message) => { ... });
    ```
    - Listens for `start`, `pause`, `stop`, `setTimes` commands; calls corresponding functions and updates state/UI.

11. **Handle Panel Disposal**
    ```ts
    controlPanel.onDidDispose(() => { controlPanel = null; });
    ```
    - Clears reference on close for future reuse.

### Summary
- Sets up restoration, UI (status bar + panel), auto-resume, and message handling.
- Connects backend logic to frontend controls.

---

## 2. `startTIMeee` Function

### Function Overview
```ts
function startTIMeee(context: vscode.ExtensionContext, statusBarItem: vscode.StatusBarItem, resume = false) { ... }
```
- **Purpose**: Core timer starter/resumer; handles countdown, session switching, and notifications.
- **Parameters**: `context` (state), `statusBarItem` (UI), `resume` (preserve time if true).

### Line-by-Line Breakdown

1. **Clear Previous Timer (if not resuming)**
   ```ts
   if (!resume && timer) { clearInterval(timer as any); timer = null; }
   ```
   - Stops old intervals to prevent overlaps.

2. **Set Initial Time (if not resuming)**
   ```ts
   if (!resume) { secondsLeft = isWork ? WORK_DURATION : BREAK_DURATION; }
   ```
   - Resets to full session duration.

3. **Update the Status Bar**
   ```ts
   updateStatusBar(statusBarItem);
   ```
   - Reflects current state.

4. **Return if Timer Already Running**
   ```ts
   if (timer) { return; }
   ```
   - Avoids duplicate intervals.

5. **Start the Interval**
   ```ts
   timer = setInterval(() => { ... }, 1000);
   ```
   - 1-second tick for countdown.

6. **Countdown Logic**
   ```ts
   if (!paused) { secondsLeft--; }
   ```
   - Decrements only if running.

7. **Update Status Bar and Save State**
   ```ts
   updateStatusBar(statusBarItem); saveState(context);
   ```
   - Refreshes UI and persists every second.

8. **Handle Session End**
   ```ts
   if (secondsLeft <= 0) { clearInterval(timer! as any); timer = null; }
   ```
   - Stops on zero.

9. **Show Notification**
   ```ts
   vscode.window.showInformationMessage(isWork ? "Work session finished! Take a break." : "Break finished! Back to work.");
   ```
   - Session-specific alerts.

10. **Switch Session Type**
    ```ts
    isWork = !isWork; paused = false; secondsLeft = isWork ? WORK_DURATION : BREAK_DURATION; saveState(context);
    ```
    - Flips type, unpauses, resets time, saves.

11. **Start the Next Session Automatically**
    ```ts
    startTIMeee(context, statusBarItem);
    ```
    - Recurses for continuous cycles.

### Summary
- Manages countdown, pause support, persistence, notifications, and Pomodoro cycling.
- Key: Recursive auto-switch for work/break loops.

---

## 3. `pauseTIMeee` Function

### Function Overview
```ts
function pauseTIMeee(context: vscode.ExtensionContext, statusBarItem: vscode.StatusBarItem) { ... }
```
- **Purpose**: Toggles pause/resume; preserves time on pause.
- **Parameters**: `context` (state), `statusBarItem` (UI).

### Line-by-Line Breakdown

1. **Check if Timer is Currently Running**
   ```ts
   if (!paused) { paused = true; clearInterval(timer as any); timer = null; saveState(context); }
   ```
   - Pauses: Sets flag, stops interval, saves state.

2. **Resume Timer if Already Paused**
   ```ts
   else { paused = false; startTIMeee(context, statusBarItem, true); }
   ```
   - Resumes: Clears flag, restarts in resume mode.

3. **Update Status Bar**
   ```ts
   updateStatusBar(statusBarItem);
   ```
   - Shows paused/running state.

### Summary
- Toggle mechanism: Pause stops without reset; resume continues from pause point.
- Integrates with `startTIMeee` and `saveState`.

| Current State | Action | Result |
|---------------|--------|--------|
| Running      | Pause | Stops, saves time |
| Paused       | Resume| Continues from pause |

---

## 4. `stopTIMeee` Function

### Function Overview
```ts
function stopTIMeee(context: vscode.ExtensionContext, statusBarItem: vscode.StatusBarItem) { ... }
```
- **Purpose**: Fully stops and resets to full session duration.
- **Parameters**: `context` (state), `statusBarItem` (UI).

### Line-by-Line Breakdown

1. **Clear the Timer Interval**
   ```ts
   if (timer) { clearInterval(timer as any); } timer = null;
   ```
   - Halts countdown.

2. **Reset Timer State**
   ```ts
   paused = false; secondsLeft = isWork ? WORK_DURATION : BREAK_DURATION;
   ```
   - Unpauses and resets to full time.

3. **Save State**
   ```ts
   saveState(context);
   ```
   - Persists reset.

4. **Update Status Bar**
   ```ts
   statusBarItem.text = "$(debug-stop) TIMeee stopped"; statusBarItem.show();
   ```
   - Shows stopped icon/text.

### Summary
- Full reset (unlike pause); differs by restoring full duration.
- Ensures fresh start on next activation.

| Step | Action |
|------|--------|
| Clear | Stops interval |
| Reset | Full time, unpaused |
| Save | Persists |
| Update | Shows "stopped" |

---

## 5. `updateStatusBar` Function

### Function Overview
```ts
function updateStatusBar(statusBarItem: vscode.StatusBarItem) { ... }
```
- **Purpose**: Formats and displays timer state in status bar.
- **Parameters**: `statusBarItem` (UI element).

### Line-by-Line Breakdown

1. **Calculate Minutes and Seconds**
   ```ts
   const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
   const seconds = (secondsLeft % 60).toString().padStart(2, "0");
   ```
   - Converts seconds to padded `MM:SS`.

2. **Check if Timer is Paused**
   ```ts
   if (paused) { statusBarItem.text = `$(debug-pause) Paused ${isWork ? "Work" : "Break"}: ${minutes}:${seconds}`; }
   ```
   - Pause icon + label + time.

3. **Timer is Running**
   ```ts
   else { statusBarItem.text = `${isWork ? "$(play) Work" : "$(coffee) Break"}: ${minutes}:${seconds}`; }
   ```
   - Work/break icons + label + time.

4. **Refresh Status Bar**
   ```ts
   statusBarItem.show();
   ```
   - Forces visual update.

### Summary
- Dynamic UI: Icons and `MM:SS` based on state.
- Called by all timer functions for real-time feedback.

| State | Display |
|-------|---------|
| Paused Work | `$(debug-pause) Paused Work: MM:SS` |
| Running Work | `$(play) Work: MM:SS` |

---

## 6. `saveState` Function

### Function Overview
```ts
function saveState(context: vscode.ExtensionContext) { ... }
```
- **Purpose**: Persists timer data to `globalState` for cross-session survival.
- **Parameters**: `context` (state storage).

### Line-by-Line Breakdown

1. **Save Work Duration**
   ```ts
   context.globalState.update("WORK_DURATION", WORK_DURATION);
   ```

2. **Save Break Duration**
   ```ts
   context.globalState.update("BREAK_DURATION", BREAK_DURATION);
   ```

3. **Save Remaining Seconds**
   ```ts
   context.globalState.update("secondsLeft", secondsLeft);
   ```

4. **Save Session Type**
   ```ts
   context.globalState.update("isWork", isWork);
   ```

5. **Save Pause State**
   ```ts
   context.globalState.update("paused", paused);
   ```

### Summary
- Saves all keys for restoration; called frequently (e.g., every second).
- Enables auto-resume on VS Code reload.

| Key | Purpose |
|-----|---------|
| `WORK_DURATION` | Custom work time |
| `secondsLeft` | Resume countdown |

---

## 7. `deactivate` Function

### Function Overview
```ts
export function deactivate() { ... }
```
- **Purpose**: Cleanup on extension unload (VS Code close/reload/disable).
- No parameters.

### Line-by-Line Breakdown

1. **Clear the Timer Interval**
   ```ts
   if (timer) { clearInterval(timer as any); }
   ```
   - Stops any running timer to prevent leaks.

### Summary
- Minimal cleanup: No save needed (handled elsewhere).
- Ensures resource efficiency.

| Step | Action |
|------|--------|
| Clear | Stops background timer |

---

## 8. `getControlPanelContent` Function

### Function Overview
```ts
function getControlPanelContent() { ... }
```
- **Purpose**: Generates HTML string for webview UI (buttons, inputs, styles).
- No parameters; returns string.

### Line-by-Line Breakdown

1. **HTML Structure**
   ```html
   <div class="control-panel"><h2>TIMeee Control</h2><div class="buttons">...</div><div class="settings">...</div></div>
   ```
   - Container with header, buttons, settings.

2. **Buttons Section**
   ```html
   <div class="buttons"><button id="start">▶ Start</button><button id="pause">⏸ Pause/Resume</button><button id="stop">⏹ Stop</button></div>
   ```
   - Control buttons with flex styling.

3. **Settings Section**
   ```html
   <div class="settings"><label>Work (min): <input id="work" type="number" value="${WORK_DURATION / 60}" /></label><label>Break (min): <input id="breakDuration" type="number" value="${BREAK_DURATION / 60}" /></label><button id="set">✔ Set</button></div>
   ```
   - Dynamic inputs for durations.

4. **CSS Styling**
   - VS Code-themed vars (`--vscode-foreground`); responsive flex, hovers, media queries.

5. **JavaScript / VS Code API**
   ```js
   const vscode = acquireVsCodeApi();
   // Event listeners for 'start', 'pause', 'stop', 'set' → postMessage({command})
   ```
   - Sends messages to extension backend.

6. **Integration**
   - Clicks → `postMessage` → `onDidReceiveMessage` → Timer functions.

### Summary
- Frontend UI: Buttons send commands; inputs update durations.
- Seamless: Themed, responsive; bridges webview to backend.

---

## Overall Flow Summary
- **Activation** → Restore + Setup UI + Auto-Resume.
- **User Input** (Webview) → Message → Timer Function (`start`/`pause`/`stop`) → Update Bar + Save State.
- **Every Second** (Running): Countdown → Update + Save.
- **End** → Notify + Switch + Recurse.
- **Deactivation** → Cleanup.
- **Persistence**: `saveState` ensures survival across reloads.

This modular design keeps TIMeee lightweight, persistent, and user-friendly. For visuals, refer to flow diagrams in development notes.