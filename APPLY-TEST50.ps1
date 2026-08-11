param(
  [string]$SitePath = $PSScriptRoot
)
$ErrorActionPreference = 'Stop'
$htmlPath = Join-Path $SitePath 'repo-sports-quidditch-v2-test.html'
if (!(Test-Path $htmlPath)) {
  Write-Host "ERROR: repo-sports-quidditch-v2-test.html was not found in $SitePath" -ForegroundColor Red
  exit 1
}
$patchName = 'repo-sports-v2-test50-flags-standings.js'
$patchPath = Join-Path $SitePath $patchName
if (!(Test-Path $patchPath)) {
  Write-Host "ERROR: $patchName is missing. Extract the whole ZIP into web2 first." -ForegroundColor Red
  exit 1
}
$backup = "$htmlPath.test49-before-test50.bak"
if (!(Test-Path $backup)) { Copy-Item $htmlPath $backup }
$html = Get-Content -Raw -LiteralPath $htmlPath
$tag = '<script src="repo-sports-v2-test50-flags-standings.js?v=test50-flags-large-table"></script>'
# Remove any older Test50 injection before applying the current one.
$html = [regex]::Replace($html, '\s*<script\s+src="repo-sports-v2-test50-flags-standings\.js[^>]*></script>\s*', "`r`n")
if ($html -match '</body>') {
  $html = $html -replace '</body>', ("  " + $tag + "`r`n</body>")
} else {
  $html += "`r`n" + $tag + "`r`n"
}
[System.IO.File]::WriteAllText($htmlPath, $html, [System.Text.UTF8Encoding]::new($false))
Write-Host ''
Write-Host 'Repo Sports V2 Test 50 applied successfully.' -ForegroundColor Green
Write-Host 'Flags: installed for all 18 new clubs.'
Write-Host 'Standings: enlarged, readable, and attached to the TV.'
Write-Host "Backup: $backup"
Write-Host ''
Write-Host 'Now hard refresh the site with Ctrl + Shift + R.' -ForegroundColor Cyan
