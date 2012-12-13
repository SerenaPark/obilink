#-------------------------------------------------
#
# Project created by QtCreator 2012-11-29T16:32:05
#
#-------------------------------------------------

QT       += core gui network

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

TARGET = KOCCA
TEMPLATE = app


SOURCES += main.cpp\
        appview.cpp \
    mylistwidget.cpp

HEADERS  += appview.h \
    mylistwidget.h

FORMS    += appview.ui

RESOURCES += \
    Resource.qrc

RC_FILE = icon.rc
