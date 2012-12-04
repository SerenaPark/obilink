#ifndef APPVIEW_H
#define APPVIEW_H

#include <QMainWindow>
#include <QDialog>
#include <QLabel>
#include <QFileDialog>
#include <QtGui>
#include <QListWidget>
#include <QListWidgetItem>

namespace Ui {
class AppView;
}

class AppView : public QMainWindow
{
    Q_OBJECT
    
public:
    explicit AppView(QWidget *parent = 0);
    ~AppView();
    bool loadXML();
    bool saveXML(QListWidget *qlist);
    bool getIPAddress();

public slots:
    void insertSharedDir();
    void removeSharedDir();

    
private:
    QString DBfile;
    Ui::AppView *ui;
    bool setConnectAddr(QString addr);
};

#endif // APPVIEW_H
