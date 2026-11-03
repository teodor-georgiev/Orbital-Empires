@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 launch-local.py
) else (
  python launch-local.py
)
pause
