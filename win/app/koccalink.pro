#-------------------------------------------------
#
# Project created by QtCreator 2013-01-10T13:45:52
#
#-------------------------------------------------

QT += core gui
QT += network xmlpatterns xml

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

TARGET = koccalink
TEMPLATE = app


SOURCES += main.cpp\
        mainwindow.cpp \
    xmlManager.cpp \
    shareDir.cpp

HEADERS  += mainwindow.h \
    xmlManager.h \
    shareDir.h

FORMS    += mainwindow.ui

RESOURCES += \
    Resource.qrc

win32 {
CONFIG += embed_manifest_exe
QMAKE_LFLAGS_WINDOWS += /MANIFESTUAC:level=\'requireAdministrator\'
}
