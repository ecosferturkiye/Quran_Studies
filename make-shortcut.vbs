Set WshShell = CreateObject("WScript.Shell")
Set oShellLink = WshShell.CreateShortcut("C:\Users\aydin\OneDrive\Masaüstü\Kuran.lnk")
oShellLink.TargetPath = "C:\Users\aydin\OneDrive\Masaüstü\ClaudeCode\Test\next-linear-quran\start-app.bat"
oShellLink.WorkingDirectory = "C:\Users\aydin\OneDrive\Masaüstü\ClaudeCode\Test\next-linear-quran"
oShellLink.IconLocation = "C:\Users\aydin\OneDrive\Masaüstü\ClaudeCode\Test\next-linear-quran\release\.icon-ico\icon.ico,0"
oShellLink.Description = "Kuran-i Kerim"
oShellLink.WindowStyle = 7
oShellLink.Save
WScript.Echo "Kisayol guncellendi!"
