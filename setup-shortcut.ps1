# Create shortcut with proper encoding
$shell = New-Object -ComObject WScript.Shell

# Get paths
$projectPath = $PSScriptRoot
$vbsPath = Join-Path $projectPath "KuranApp.vbs"
$iconPath = Join-Path $projectPath "release\.icon-ico\icon.ico"

# Get desktop path properly
$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopPath "Kuran.lnk"

# Create shortcut
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $projectPath
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Description = "Kuran-i Kerim Uygulamasi"
$shortcut.WindowStyle = 7
$shortcut.Save()

Write-Host "Shortcut created at: $shortcutPath"
