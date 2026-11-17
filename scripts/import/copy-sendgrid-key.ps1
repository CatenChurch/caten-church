# Copies SENDGRID_API_KEY from the Rails site's Heroku config to the Worker's secrets, without
# printing it. Needs `heroku login` and `wrangler login` on this computer.
#   .\scripts\import\copy-sendgrid-key.ps1
$ErrorActionPreference = 'Stop'
$app = if ($env:HEROKU_APP) { $env:HEROKU_APP } else { 'caten-church' }
Set-Location (Join-Path $PSScriptRoot '..\..')
fnm exec --using=26 npx.cmd --yes heroku config:get SENDGRID_API_KEY -a $app |
  fnm exec --using=26 node node_modules/wrangler/bin/wrangler.js secret put SENDGRID_API_KEY
