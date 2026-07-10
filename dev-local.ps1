$ErrorActionPreference = "Stop"

# OneDrive blocks Node from reading project files (errno -4094). Run Next.js from a local folder instead.
$src = (Resolve-Path (Split-Path -Parent $MyInvocation.MyCommand.Path)).Path
$dst = Join-Path $env:LOCALAPPDATA "8sem-frontend-run"

if (-not (Test-Path $dst)) {
  New-Item -ItemType Directory -Path $dst -Force | Out-Null
}

$syncDirs = @("app", "components", "contexts", "hooks", "lib", "store", "types", "public")
$syncFiles = @(
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "next.config.js",
  "next.config.mjs",
  "postcss.config.mjs",
  "tsconfig.json",
  "eslint.config.mjs",
  "next-env.d.ts",
  ".env.local"
)

function Sync-DuoFrontend {
  foreach ($dir in $syncDirs) {
    $from = Join-Path $src $dir
    if (Test-Path $from) {
      robocopy $from (Join-Path $dst $dir) /MIR /NFL /NDL /NJH /NJS /nc /ns /np /R:1 /W:1 | Out-Null
    }
  }

  foreach ($file in $syncFiles) {
    $from = Join-Path $src $file
    if (Test-Path $from) {
      Copy-Item -Force $from (Join-Path $dst $file)
    }
  }
}

Sync-DuoFrontend

$nodeModules = Join-Path $dst "node_modules"
$installKeyFile = Join-Path $nodeModules ".install-key"
$lockSrc = Join-Path $src "package-lock.json"
$pkgSrc = Join-Path $src "package.json"

function Get-InstallKey {
  param([string]$LockPath, [string]$PackagePath)
  $parts = @()
  if (Test-Path $LockPath) {
    $parts += (Get-FileHash $LockPath -Algorithm SHA256).Hash
  }
  if (Test-Path $PackagePath) {
    $parts += (Get-FileHash $PackagePath -Algorithm SHA256).Hash
  }
  return ($parts -join ":")
}

$currentInstallKey = Get-InstallKey -LockPath $lockSrc -PackagePath $pkgSrc
$needsInstall = -not (Test-Path $nodeModules)

if (Test-Path $installKeyFile) {
  $storedKey = Get-Content $installKeyFile -Raw
  if ($storedKey.Trim() -ne $currentInstallKey) {
    $needsInstall = $true
  }
} else {
  $needsInstall = $true
}

if ($needsInstall) {
  Write-Host "Installing dependencies in $dst ..."
  Push-Location $dst
  npm install
  if (-not (Test-Path $nodeModules)) {
    New-Item -ItemType Directory -Path $nodeModules -Force | Out-Null
  }
  Set-Content -Path $installKeyFile -Value $currentInstallKey -Encoding utf8 -NoNewline
  Pop-Location
}

# Keep the local run folder synced while Next.js is running (initial script only copied once).
$syncJob = Start-Job -Name "duo-frontend-sync" -ScriptBlock {
  param($Source, $Destination, $Dirs, $Files)

  function Sync-Tree {
    param($SrcRoot, $DstRoot, $DirList, $FileList)

    foreach ($dir in $DirList) {
      $from = Join-Path $SrcRoot $dir
      if (Test-Path $from) {
        robocopy $from (Join-Path $DstRoot $dir) /MIR /NFL /NDL /NJH /NJS /nc /ns /np /R:1 /W:1 | Out-Null
      }
    }

    foreach ($file in $FileList) {
      $from = Join-Path $SrcRoot $file
      if (Test-Path $from) {
        Copy-Item -Force $from (Join-Path $DstRoot $file)
      }
    }
  }

  function Get-InstallKey {
    param([string]$LockPath, [string]$PackagePath)
    $parts = @()
    if (Test-Path $LockPath) {
      $parts += (Get-FileHash $LockPath -Algorithm SHA256).Hash
    }
    if (Test-Path $PackagePath) {
      $parts += (Get-FileHash $PackagePath -Algorithm SHA256).Hash
    }
    return ($parts -join ":")
  }

  $lastInstallKey = Get-InstallKey `
    -LockPath (Join-Path $Destination "package-lock.json") `
    -PackagePath (Join-Path $Destination "package.json")

  while ($true) {
    Sync-Tree -SrcRoot $Source -DstRoot $Destination -DirList $Dirs -FileList $Files

    $installKey = Get-InstallKey `
      -LockPath (Join-Path $Destination "package-lock.json") `
      -PackagePath (Join-Path $Destination "package.json")

    if ($installKey -and $installKey -ne $lastInstallKey) {
      Push-Location $Destination
      npm install --prefer-offline 2>&1 | Out-Null
      $keyFile = Join-Path $Destination "node_modules\.install-key"
      if (-not (Test-Path (Join-Path $Destination "node_modules"))) {
        New-Item -ItemType Directory -Path (Join-Path $Destination "node_modules") -Force | Out-Null
      }
      Set-Content -Path $keyFile -Value $installKey -Encoding utf8 -NoNewline
      Pop-Location
      $lastInstallKey = $installKey
    }

    Start-Sleep -Milliseconds 900
  }
} -ArgumentList $src, $dst, $syncDirs, $syncFiles

Write-Host ""
Write-Host "Source:  $src"
Write-Host "Running: $dst"
Write-Host "Open:    http://localhost:3000"
Write-Host "Live sync: source -> running folder every ~0.9s (no restart needed)"
Write-Host "Tip: npm run dev:next runs directly from Source if OneDrive is not blocking files"
Write-Host ""

try {
  Push-Location $dst
  npm run dev:next
} finally {
  Stop-Job -Name "duo-frontend-sync" -ErrorAction SilentlyContinue
  Remove-Job -Name "duo-frontend-sync" -Force -ErrorAction SilentlyContinue
}
