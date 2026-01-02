$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\OneDrive\Masaüstü\Kuran-i Kerim.lnk")
$Shortcut.TargetPath = "$env:USERPROFILE\OneDrive\Masaüstü\ClaudeCode\Test\next-linear-quran\start-app.bat"
$Shortcut.WorkingDirectory = "$env:USERPROFILE\OneDrive\Masaüstü\ClaudeCode\Test\next-linear-quran"
$Shortcut.IconLocation = "$env:USERPROFILE\OneDrive\Masaüstü\ClaudeCode\Test\next-linear-quran\release\.icon-ico\icon.ico,0"
$Shortcut.Description = "Kuran-i Kerim Uygulamasi"
$Shortcut.WindowStyle = 7
$Shortcut.Save()

Write-Host "Kisayol olusturuldu: Kuran-i Kerim.lnk"
