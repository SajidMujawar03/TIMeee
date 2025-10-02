# TIMeee

[![Version](https://vsmarketplacebadge.apphb.com/version/timmyi.timeee.svg)](https://marketplace.visualstudio.com/items?itemName=timmyi.timeee)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/timmyi.timeee.svg)](https://marketplace.visualstudio.com/items?itemName=timmyi.timeee)
[![Rating](https://vsmarketplacebadge.apphb.com/rating/timmyi.timeee.svg)](https://marketplace.visualstudio.com/items?itemName=timmyi.timeee)

TIMeee is a lightweight Pomodoro timer extension for Visual Studio Code. It helps you stay focused with customizable work and break sessions, displayed directly in the status bar. Sessions persist across VS Code restarts, so you can pick up right where you left off.

Inspired by the Pomodoro Technique: work in focused bursts (default 25 minutes), followed by short breaks (default 5 minutes), and switch automatically.

## Features

- **Status Bar Timer**: Real-time countdown in the VS Code status bar with icons for work (▶) and break (☕) modes.
- **Pause/Resume**: Easily pause sessions without losing progress.
- **Auto-Switching**: Automatically transitions from work to break (and vice versa) with a notification.
- **Custom Durations**: Adjust work and break times via the control panel or command.
- **Persistent State**: Saves your current session, durations, and pause status to VS Code's global state.
- **Control Panel**: A sleek webview panel for starting, pausing, stopping, and configuring timers.
- **Commands Integration**: Full support for VS Code's command palette and keybindings.

## Installation

1. **From VS Code Marketplace**:
   - Open VS Code.
   - Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X` on macOS).
   - Search for "TIMeee".
   - Click **Install**.

2. **From Source** (for development):
   - Clone this repository: `git clone https://github.com/yourusername/timeee.git`.
   - Open the folder in VS Code.
   - Press `F5` to run in Extension Development Host.
   - Or, package it with `vsce package` and install the `.vsix` file via **Extensions > ... > Install from VSIX**.

## Usage

### Quick Start
1. Reload VS Code after installation (or restart).
2. Look for the timer in the status bar (right-aligned): `Work: 25:00` (or your last saved state).
3. Click the status bar item to open the **TIMeee Control** panel.
4. Use the buttons in the panel:
   - **▶ Start**: Begin a work session.
   - **⏸ Pause/Resume**: Toggle pause (progress is saved).
   - **⏹ Stop**: Reset to full work duration.
   - **✔ Set**: Update work/break durations (in minutes).

### Via Command Palette
Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):
- `TIMeee: Open Control Panel` – Opens the control panel.
- `TIMeee: Start` – Starts a new session.
- `TIMeee: Pause` – Toggles pause/resume.
- `TIMeee: Stop` – Stops and resets the timer.

### Status Bar Indicators
- `▶ Work: MM:SS` – Active work session.
- `☕ Break: MM:SS` – Active break session.
- `⏸ Paused Work/Break: MM:SS` – Paused session.
- `⏹ TIMeee stopped` – Timer stopped.

When a session ends, you'll get a notification: *"Work session finished! Take a break."* or *"Break finished! Back to work."* The next session starts automatically.

## Screenshots

### Status Bar in Action
![Status Bar](https://via.placeholder.com/800x100/007acc/ffffff?text=Work:+12:34)  
*(Active work session in the status bar.)*

### Control Panel
![Control Panel](https://via.placeholder.com/400x300/1e1e1e/ffffff?text=TIMeee+Control+Panel)  
*(Webview panel with buttons and settings. Integrates with VS Code's theme.)*

*(Add real screenshots to the `images/` folder in your repo for the marketplace.)*

## Configuration

No `settings.json` options yet—everything is handled via the control panel. Future updates may include theme customizations.

## Keybindings

Default: None (to avoid conflicts). Customize in `keybindings.json`:
```json
[
  {
    "command": "timeee.start",
    "key": "ctrl+alt+s",
    "when": "editorTextFocus"
  }
]
```

## Contributing

Contributions are welcome! 

1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

For development:
- Install dependencies: `npm install`.
- Run in debug mode: `F5`.
- Package: `npm install -g vsce && vsce package`.

Report issues or feature requests in the [Issues](https://github.com/yourusername/timeee/issues) tab.

## License

MIT License – see [LICENSE](LICENSE) for details.

---

*Built with ❤️ for productive coding. Questions? Open an issue!*