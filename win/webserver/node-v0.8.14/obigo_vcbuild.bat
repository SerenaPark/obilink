vcbuild.bat

xcopy .\Release\node.exe ..\..\bin\
xcopy .\Release\node.lib ..\..\bin\
xcopy .\Release\lib\*.* ..\..\bin\lib\ /e /k
