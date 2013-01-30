#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QProcess>

/* File     : mainwindow.h
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 2.0
 * Date     : 2013-01-25
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

private slots:
    void on_btn_add_clicked();                                  // trigger with PushButton(btn_plus)
    void on_btn_remove_clicked();                               // trigger with PushButton(btn_minus)
    void on_btn_startshare_clicked();                           // trigger with PushButton(btn_startShare)
    void on_btn_stopshare_clicked();                            // trigger with PushButton(btn_stopShare)
    void on_cb_dropbox_clicked();                               // trigger with CheckBox(cb_dropbox)
    void processFinished(int, QProcess::ExitStatus);
};

#endif // MAINWINDOW_H
