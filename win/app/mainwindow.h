#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QProcess>

/* File     : mainwindow.h
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 1.0.1
 * Date     : 2013-01-22
 */

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT
    
public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

    
private:
    Ui::MainWindow *ui;
    QProcess m_serverProc;                                      // call Node.js program

private:
    void initialize();
    void updateShareAddress();                                  // update IP Address and QRcode for share
    void updateListwidget();                                    // update UI ListWidget from m_localShareDirList
    void displayShareAddress(QString addr);                     // display server IP address on UI
    void displayQRCode(QString addr);                           // display server QR code of IP address on UI
    QString getIPAddress();                                     // get server IP address

public slots:
    void insertSharedDir();                                     // trigger with PushButton(btn_plus)
    void removeSharedDir();                                     // trigger with PushButton(btn_minus)
    void startShare();                                          // trigger with PushButton(btn_startShare)
    void stopShare();                                           // trigger with PushButton(btn_stopShare)
    void shareDropbox();                                        // trigger with CheckBox(cb_dropbox)
};

#endif // MAINWINDOW_H
