#ifndef APPVIEW_H
#define APPVIEW_H

#include <QMainWindow>
#include <QDialog>
#include <QLabel>
#include <QFileDialog>
#include <QtGui>
#include <QListWidget>
#include <QListWidgetItem>
#include <QMessageBox>

#define DBFILE "./shDir.xml"

namespace Ui {
class AppView;
}


class AppView : public QMainWindow
{
    Q_OBJECT
    
public:
    explicit AppView(QWidget *parent = 0);
    ~AppView();
    bool getIPAddress();
    Ui::AppView *ui;
    static bool saveXML(QListWidget *qlist);
    static bool loadXML(Ui::AppView *ui);

public slots:
    void insertSharedDir();
    void removeSharedDir();
    
private:
    bool setConnectAddr(QString addr);
};

#endif // APPVIEW_H
