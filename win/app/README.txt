KOCCA SERVER


бс FOR EXECUTING THIS PROGRAM.

1. Compile sources with release mode for getting windows administrator permission (UAC).
2. Copy compiled binary files to new directory named 'bin'
3. Copy library files in 'lib' directory to 'bin'
4. Copy 'qrcode.exe' in 'extbin' directory to 'bin\extbin'
5. Copy Node.js binary files to 'bin\node'
5. Run KOCCA.exe



бс FOR DEBUG

1. Open koccalink.pro and remove below sentence
--------------------------------------------------------------------
win32 {
CONFIG += embed_manifest_exe
QMAKE_LFLAGS_WINDOWS += /MANIFESTUAC:level=\'requireAdministrator\'}
--------------------------------------------------------------------

бс CAUTION

1. Please remove all from previous compiled files before compile it.
2. Please execute this program as binary with library to use windows UAC.

