Set WshShell = CreateObject("WScript.Shell")
Set Shortcut = WshShell.CreateShortcut("C:\Users\aydin\OneDrive\Masaüstü\Kuran-i Kerim.lnk")
Shortcut.TargetPath = "C:\Users\aydin\OneDrive\Masaüstü\ClaudeCode\Test\next-linear-quran\release\win-unpacked\Kuran-ı Kerim.exe"
Shortcut.WorkingDirectory = "C:\Users\aydin\OneDrive\Masaüstü\ClaudeCode\Test\next-linear-quran\release\win-unpacked"
Shortcut.Save
