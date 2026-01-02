Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptPath
WshShell.Run "npm run electron", 0, False
