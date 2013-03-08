#-------------------------------------------------
#
# Project created by QtCreator 2013-01-10T13:45:52
#
#-------------------------------------------------

QT += core gui
QT += network xmlpatterns xml

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

TARGET = obilink
TEMPLATE = app


SOURCES += main.cpp\
        mainwindow.cpp \
    xmlManager.cpp \
    droplistwidget.cpp

HEADERS  += mainwindow.h \
    xmlManager.h \
    droplistwidget.h

FORMS    += mainwindow.ui

RESOURCES += \
    Resource.qrc

RC_FILE = icon.rc
