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

public slots:
    void setConnectAddr();
    void insertSharedDir();
    void removeSharedDir();
    void saveXML(QListWidget *qlist);
    
private:
    Ui::AppView *ui;
};

#endif // APPVIEW_H
