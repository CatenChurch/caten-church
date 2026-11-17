# Same as export-from-heroku.sh, but takes the database address from the Heroku CLI logged in on
# Windows (`heroku login`) and runs the export in WSL, where psql is installed. Read-only.
#   .\scripts\import\export-from-heroku.ps1
$ErrorActionPreference = 'Stop'
$app = if ($env:HEROKU_APP) { $env:HEROKU_APP } else { 'caten-church' }
$script = '/mnt/c' + ($PSScriptRoot -replace '^C:', '' -replace '\\', '/') + '/export-from-heroku.sh'
fnm exec --using=26 npx.cmd --yes heroku config:get DATABASE_URL -a $app | wsl -e bash $script --stdin
