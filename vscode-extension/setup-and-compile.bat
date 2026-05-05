@echo off
echo ========================================
echo VS Code Extension Setup and Compilation
echo ========================================
echo.

echo Step 1: Verifying setup...
node verify-setup.js
echo.

echo Step 2: Installing dependencies...
call npm install
echo.

echo Step 3: Compiling TypeScript...
call npm run compile
echo.

if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo ✅ SUCCESS! Extension compiled successfully
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Open this folder in VS Code
    echo 2. Press F5 to test the extension
    echo 3. Login with: employee1@example.com / Employee@123
    echo.
) else (
    echo ========================================
    echo ❌ COMPILATION FAILED
    echo ========================================
    echo.
    echo Please check the error messages above
    echo.
)

pause
