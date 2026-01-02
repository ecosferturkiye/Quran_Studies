$shell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcut = $shell.CreateShortcut("$desktop\Kuran.lnk")
$shortcut.TargetPath = "C:\Users\aydin\OneDrive\Masaüstü\ClaudeCode\Test\next-linear-quran\release\win-unpacked\Kuran.exe"
$shortcut.WorkingDirectory = "C:\Users\aydin\OneDrive\Masaüstü\ClaudeCode\Test\next-linear-quran\release\win-unpacked"
$shortcut.Save()
Remove-Item "$desktop\Kuran.bat" -ErrorAction SilentlyContinue
Write-Host "Kısayol oluşturuldu!"
