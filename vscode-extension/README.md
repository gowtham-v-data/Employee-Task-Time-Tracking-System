# Employee Tracker VS Code Extension

View your assigned tasks directly in VS Code!

## 🚀 Quick Start

### Windows
```bash
.\setup-and-compile.bat
```

### Mac/Linux/Git Bash
```bash
chmod +x setup-and-compile.sh
./setup-and-compile.sh
```

### Manual
```bash
npm install
npm run compile
```

## 🧪 Test

1. Press `F5` in VS Code
2. Login with: `employee1@example.com` / `Employee@123`
3. See your tasks in the sidebar!

## 📚 Documentation

See the root folder for complete guides:
- **VSCODE_EXTENSION_START_HERE.md** - Quick setup
- **VSCODE_EXTENSION_INSTALLATION.md** - Full guide
- **VSCODE_EXTENSION_FIX.md** - Troubleshooting
- **VSCODE_EXTENSION_COMPLETE_GUIDE.md** - Everything

## ✅ Requirements

- VS Code 1.60.0+
- Node.js 14+
- Backend running on http://localhost:5000

## 🎯 Features

- View assigned tasks in sidebar
- Update task status with right-click
- Auto-refresh every 5 minutes
- View task details
- Secure authentication

## 📦 Package

```bash
npm install -g @vscode/vsce
vsce package
```

Creates: `employee-tracker-tasks-1.0.0.vsix`

## 🐛 Issues?

1. Make sure backend is running
2. Check you're in the `vscode-extension` folder
3. Run `node verify-setup.js` to check setup
4. See **VSCODE_EXTENSION_FIX.md** for detailed troubleshooting

---

**Happy Coding!** 💻✨
