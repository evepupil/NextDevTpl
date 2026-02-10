@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem === Config ===
set "APP_NAME=NextjsTpl"
set "REMOTE_USER=ubuntu"
set "REMOTE_HOST=<your-server>"
set "REMOTE_PORT=22"
set "REMOTE_DIR=/home/ubuntu/NextjsTpl"
set "SSH_KEY=%USERPROFILE%\.ssh\id_ed25519"
set "PORT=3303"
set "PACKAGE_MANAGER=pnpm"
set "TAR_FILE=deploy.tgz"

rem === Load production env ===
if not exist .env.prod (
  echo ERROR: .env.prod not found. Create it with production values.
  exit /b 1
)
copy /Y .env.prod .env.production.local >nul

rem === Build ===
if /I "%PACKAGE_MANAGER%"=="pnpm" (
  call pnpm install
  if errorlevel 1 goto :cleanup
  call pnpm run build
  if errorlevel 1 goto :cleanup
) else if /I "%PACKAGE_MANAGER%"=="npm" (
  call npm install
  if errorlevel 1 goto :cleanup
  call npm run build
  if errorlevel 1 goto :cleanup
) else if /I "%PACKAGE_MANAGER%"=="yarn" (
  call yarn install
  if errorlevel 1 goto :cleanup
  call yarn build
  if errorlevel 1 goto :cleanup
) else (
  echo Unknown PACKAGE_MANAGER: %PACKAGE_MANAGER%
  goto :cleanup
)

rem === Remove temp env file ===
if exist .env.production.local del /f /q .env.production.local

rem === Package ===
set "FILES=.next public package.json .env.prod"
if exist pnpm-lock.yaml set "FILES=!FILES! pnpm-lock.yaml"
if exist package-lock.json set "FILES=!FILES! package-lock.json"
if exist yarn.lock set "FILES=!FILES! yarn.lock"
if exist next.config.mjs set "FILES=!FILES! next.config.mjs"
if exist next.config.js set "FILES=!FILES! next.config.js"
if exist start-prod.sh set "FILES=!FILES! start-prod.sh"

if exist "%TAR_FILE%" del /f /q "%TAR_FILE%"

tar -czf "%TAR_FILE%" --exclude=.next/dev --exclude=.next/cache %FILES%
if errorlevel 1 exit /b 1

rem === Upload ===
set "SSH_KEY_ARG="
if not "%SSH_KEY%"=="" set "SSH_KEY_ARG=-i \"%SSH_KEY%\""

scp -P %REMOTE_PORT% %SSH_KEY_ARG% "%TAR_FILE%" "%REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%/"
if errorlevel 1 exit /b 1

rem === Extract on server and restart ===
ssh -p %REMOTE_PORT% %SSH_KEY_ARG% "%REMOTE_USER%@%REMOTE_HOST%" "cd %REMOTE_DIR% && tar -xzf %TAR_FILE% && cp -f .env.prod .env.local && sed -i 's/\r$//' start-prod.sh && chmod +x start-prod.sh && SKIP_INSTALL=1 SKIP_BUILD=1 FORCE_EXTRACT=0 bash start-prod.sh"
if errorlevel 1 exit /b 1

echo Deploy complete.
exit /b 0

:cleanup
if exist .env.production.local del /f /q .env.production.local
echo Deploy failed.
exit /b 1
