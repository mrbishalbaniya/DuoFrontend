$ErrorActionPreference = "Stop"

# OneDrive blocks Node from reading project files (errno -4094). Run Next.js from a local folder instead.
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$dst = Join-Path $env:LOCALAPPDATA "8sem-frontend-run"

if (-not (Test-Path $dst)) {
  New-Item -ItemType Directory -Path $dst -Force | Out-Null
}

$dirs = @("app", "components", "contexts", "lib", "types", "public")
foreach ($dir in $dirs) {
  $from = Join-Path $src $dir
  if (Test-Path $from) {
    # /MIR keeps the local run folder in sync with OneDrive source (including deletions).
    robocopy $from (Join-Path $dst $dir) /MIR /NFL /NDL /NJH /NJS /nc /ns /np /R:1 /W:1 | Out-Null
  }
}

$files = @(
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "next.config.js",
  "postcss.config.mjs",
  "tsconfig.json",
  "eslint.config.mjs",
  "next-env.d.ts"
)
foreach ($file in $files) {
  $from = Join-Path $src $file
  if (Test-Path $from) {
    Copy-Item -Force $from (Join-Path $dst $file)
  }
}

$nodeModules = Join-Path $dst "node_modules"
$stampFile = Join-Path $nodeModules ".install-stamp"
$lockSrc = Join-Path $src "package-lock.json"
$needsInstall = -not (Test-Path $nodeModules)

if (Test-Path $lockSrc) {
  $lockTime = (Get-Item $lockSrc).LastWriteTimeUtc
  $stampTime = if (Test-Path $stampFile) {
    (Get-Item $stampFile).LastWriteTimeUtc
  } else {
    [datetime]::MinValue
  }
  if ($lockTime -gt $stampTime) {
    $needsInstall = $true
  }
}

if ($needsInstall) {
  Write-Host "Installing dependencies in $dst ..."
  Push-Location $dst
  npm install
  if (-not (Test-Path $nodeModules)) {
    New-Item -ItemType Directory -Path $nodeModules -Force | Out-Null
  }
  Set-Content -Path $stampFile -Value (Get-Date).ToString("o") -Encoding utf8
  Pop-Location
}

Write-Host ""
Write-Host "Source:  $src"
Write-Host "Running: $dst"
Write-Host "Open:    http://localhost:3000"
Write-Host "Tip: npm run dev:next only works outside OneDrive"
Write-Host ""

Push-Location $dst
npm run dev:next
