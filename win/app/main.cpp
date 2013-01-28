#include "mainwindow.h"
#include <QApplication>

/* File     : main.cpp
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 2.0
 * Date     : 2013-01-25
 */

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    MainWindow w;
    w.show();
    
    return a.exec();
}
