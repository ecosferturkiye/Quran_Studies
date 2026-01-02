$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop "Kuran-i Kerim.lnk"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "$PSScriptRoot\node_modules\electron\dist\electron.exe"
$Shortcut.Arguments = "$PSScriptRoot\electron\main.js"
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.IconLocation = "$PSScriptRoot\electron\icon.ico,0"
$Shortcut.Description = "Kuran-i Kerim Okuma Uygulamasi"
$Shortcut.Save()

Write-Host "Shortcut created at: $ShortcutPath"
