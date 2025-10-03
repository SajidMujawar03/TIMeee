import * as vscode from "vscode";

let timer: NodeJS.Timer | null = null;
let secondsLeft: number;
let isWork: boolean;
let paused: boolean;
let controlPanel: vscode.WebviewPanel | null = null;

// Durations in seconds
let WORK_DURATION: number;
let BREAK_DURATION: number;

export function activate(context: vscode.ExtensionContext) {
  // Restore previous state or use defaults
  WORK_DURATION = context.globalState.get("WORK_DURATION", 25 * 60);
  BREAK_DURATION = context.globalState.get("BREAK_DURATION", 5 * 60);
  secondsLeft = context.globalState.get("secondsLeft", WORK_DURATION);
  isWork = context.globalState.get("isWork", true);
  paused = context.globalState.get("paused", false);

  // Status bar
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.tooltip = "Click to open TIMeee Control Panel";
  statusBarItem.command = "timeee.openControlPanel";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  updateStatusBar(statusBarItem);

  // Auto-start timer if it was running
  if (!paused) {
    startTIMeee(context, statusBarItem, true);
  }

  // Control panel command
  const controlPanelCommand = vscode.commands.registerCommand(
    "timeee.openControlPanel",
    () => {
      if (controlPanel) {
        controlPanel.reveal(vscode.ViewColumn.Beside, true);
        return;
      }

      controlPanel = vscode.window.createWebviewPanel(
        "timeeeControl",
        "TIMeee Control",
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      controlPanel.iconPath = vscode.Uri.file(
        context.asAbsolutePath("media/timee.svg") // path to your icon
      );

      controlPanel.webview.html = getControlPanelContent();

      // Handle messages from webview
      controlPanel.webview.onDidReceiveMessage((message) => {
        if (message.command === "start") {
          paused = false;
          startTIMeee(context, statusBarItem);
        } else if (message.command === "pause") {
          pauseTIMeee(context, statusBarItem);
        } else if (message.command === "stop") {
          stopTIMeee(context, statusBarItem);
        } else if (message.command === "setTimes") {
          const workMinutes = Number(message.work);
          const breakMinutes = Number(message.breakDuration);
          if (workMinutes > 0 && breakMinutes > 0) {
            WORK_DURATION = workMinutes * 60;
            BREAK_DURATION = breakMinutes * 60;
            isWork = true;
            secondsLeft = WORK_DURATION;
            paused = false;
            saveState(context);
            updateStatusBar(statusBarItem);
            vscode.window.showInformationMessage(
              `TIMeee updated: Work ${workMinutes} min, Break ${breakMinutes} min`
            );
          } else {
            vscode.window.showErrorMessage(
              "Work and Break durations must be greater than 0"
            );
          }
        }
      });

      controlPanel.onDidDispose(() => {
        controlPanel = null;
      });
    }
  );
  context.subscriptions.push(controlPanelCommand);
}

// Timer functions
function startTIMeee(
  context: vscode.ExtensionContext,
  statusBarItem: vscode.StatusBarItem,
  resume = false
) {
  if (!resume && timer) {
    clearInterval(timer as any);
    timer = null;
  }

  if (!resume) {
    secondsLeft = isWork ? WORK_DURATION : BREAK_DURATION;
  }

  updateStatusBar(statusBarItem);

  if (timer) {
    return;
  }

  timer = setInterval(() => {
    if (!paused) {
      secondsLeft--;
    }
    updateStatusBar(statusBarItem);
    saveState(context);

    if (secondsLeft <= 0) {
      clearInterval(timer! as any);
      timer = null;

      vscode.window.showInformationMessage(
        isWork
          ? "Work session finished! Take a break."
          : "Break finished! Back to work."
      );

      isWork = !isWork;
      paused = false;
      secondsLeft = isWork ? WORK_DURATION : BREAK_DURATION;
      saveState(context);
      startTIMeee(context, statusBarItem);
    }
  }, 1000);
}

function pauseTIMeee(
  context: vscode.ExtensionContext,
  statusBarItem: vscode.StatusBarItem
) {
  if (!paused) {
    paused = true;
    clearInterval(timer as any);
    timer = null;
    saveState(context);
  } else {
    paused = false;
    startTIMeee(context, statusBarItem, true);
  }
  updateStatusBar(statusBarItem);
}

function stopTIMeee(
  context: vscode.ExtensionContext,
  statusBarItem: vscode.StatusBarItem
) {
  if (timer) {
    clearInterval(timer as any);
  }
  timer = null;
  paused = false;
  secondsLeft = isWork ? WORK_DURATION : BREAK_DURATION;
  saveState(context);
  statusBarItem.text = "$(debug-stop) TIMeee stopped";
  statusBarItem.show();
}

function updateStatusBar(statusBarItem: vscode.StatusBarItem) {
  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  if (paused) {
    statusBarItem.text = `$(debug-pause) Paused ${
      isWork ? "Work" : "Break"
    }: ${minutes}:${seconds}`;
  } else {
    statusBarItem.text = `${
      isWork ? "$(play) Work" : "$(coffee) Break"
    }: ${minutes}:${seconds}`;
  }

  statusBarItem.show();
}

function saveState(context: vscode.ExtensionContext) {
  context.globalState.update("WORK_DURATION", WORK_DURATION);
  context.globalState.update("BREAK_DURATION", BREAK_DURATION);
  context.globalState.update("secondsLeft", secondsLeft);
  context.globalState.update("isWork", isWork);
  context.globalState.update("paused", paused);
}

export function deactivate() {
  if (timer) {
    clearInterval(timer as any);
  }
}


function getControlPanelContent() {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>time</title>
    <style>
      /* Theme colors */
      body {
        font-family: 'Segoe UI', Tahoma, sans-serif;
        margin: 0; padding: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 250px;
        max-width: 100%;
        color: var(--vscode-foreground);
        background-color: var(--vscode-editor-background);
      }

      h2 {
        margin-bottom: 15px;
        font-size: 18px;
        text-align: center;
        color: var(--vscode-titleBar-activeForeground);
      }

      .control-panel {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        background: var(--vscode-editorWidget-background);
        padding: 15px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        width: 100%;
        max-width: 360px;
        border: 1px solid var(--vscode-editorWidget-border);
        box-sizing: border-box;
      }

      .buttons {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 20px;
      }

      button {
        flex: 1 1 80px;
        padding: 10px 0;
        font-size: 14px;
        border-radius: 8px;
        border: 1px solid var(--vscode-button-border);
        cursor: pointer;
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        font-weight: bold;
        transition: background-color 0.2s;
        min-width: 80px;
      }

      button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }

      .settings {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .settings label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
      }

      .settings input {
        width: 60px;
        padding: 3px 5px;
        border-radius: 5px;
        border: 1px solid var(--vscode-input-border);
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
      }

      .settings button {
        width: 100%;
        margin-top: 5px;
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }

      .settings button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }

      @media (max-width: 320px) {
        .buttons {
          flex-direction: column;
        }

        button {
          flex: 1 1 100%;
        }
      }
    </style>
  </head>
  <body>
    <div class="control-panel">
      <h2>TIMeee Control</h2>

      <div class="buttons">
        <button id="start">▶ Start</button>
        <button id="pause">⏸ Pause/Resume</button>
        <button id="stop">⏹ Stop</button>
      </div>

      <div class="settings">
        <label>
          Work (min):
          <input id="work" type="number" value="${WORK_DURATION / 60}" />
        </label>
        <label>
          Break (min):
          <input id="breakDuration" type="number" value="${
            BREAK_DURATION / 60
          }" />
        </label>
        <button id="set">✔ Set</button>
      </div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      document.getElementById('start').addEventListener('click', () => vscode.postMessage({ command: 'start' }));
      document.getElementById('pause').addEventListener('click', () => vscode.postMessage({ command: 'pause' }));
      document.getElementById('stop').addEventListener('click', () => vscode.postMessage({ command: 'stop' }));
      document.getElementById('set').addEventListener('click', () => {
        const work = document.getElementById('work').value;
        const breakDuration = document.getElementById('breakDuration').value;
        vscode.postMessage({ command: 'setTimes', work, breakDuration });
      });
    </script>
  </body>
  </html>
  `;
}
