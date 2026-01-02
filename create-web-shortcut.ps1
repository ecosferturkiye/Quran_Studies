$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop "NLQ Web.url"

# Create URL shortcut (internet shortcut)
$Content = @"
[InternetShortcut]
URL=http://localhost:3000
IconIndex=0
IconFile=$PSScriptRoot\electron\icon.ico
"@

Set-Content -Path $ShortcutPath -Value $Content -Encoding ASCII

Write-Host "Web shortcut created at: $ShortcutPath"
