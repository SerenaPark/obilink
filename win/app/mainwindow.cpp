#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "xmlManager.h"
#include <QtNetwork/QNetworkInterface>
#include <QFileDialog>

/* File     : mainwindow.cpp
 * Author   : Edgar Seo, Ted Kim
 * Company  : OBIGO KOREA
 * Version  : 2.0.1
 * Date     : 2013-01-28
 */

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    // fix window size & disable cursor at border of window
    Qt::WindowFlags flags = Qt::Window | Qt::MSWindowsFixedSizeDialogHint;
    setWindowFlags(flags);
    setFixedSize(358, 544);

    initialize();
}


MainWindow::~MainWindow()
{
    CXmlManager::destroy();
    delete ui;
}


void MainWindow::initialize()
{
    CXmlManager::instance()->loadXML();

    ui->cb_dropbox->setChecked(CXmlManager::instance()->isDropboxShareMode());
    ui->btn_stopshare->setEnabled(false);

    updateShareAddress();
    updateListwidget();

    return;
}


void MainWindow::updateShareAddress()
{
    QString shareAddress = getIPAddress();

    displayShareAddress(shareAddress);
    displayQRCode(shareAddress);

    return;
}


void MainWindow::updateListwidget()
{
    if ( ui->listWidget == NULL || ui == NULL)
        return;

    ui->listWidget->clear();
    ui->listWidget->addItems(CXmlManager::instance()->getLocalShareDirList());

    return;
}


void MainWindow::displayShareAddress(QString addr)
{
    ui->lb_addr->setText(addr);
    return;
}

void MainWindow::displayQRCode(QString addr)
{
    QDir dir;
    QString command = "\"" + dir.currentPath() + "\\extbin\\qrcode.exe\"";
    QString arg1 = "\"" + dir.currentPath() + "\\extbin\\qrcodepic.png\"";
    QString qrcodePath = dir.currentPath() + "\\extbin\\qrcodepic.png";

    QProcess::execute(command + " -o " + arg1 + " -s 5 -l H " + addr);
    ui->lb_qrcode->setPixmap(QPixmap::QPixmap(qrcodePath).scaled(100, 100, Qt::KeepAspectRatio));

    return;
}


QString MainWindow::getIPAddress()
{
    QDir dir;
    QProcess proc;
    QString serverIPAddress;
    QString command = "\"" + dir.currentPath() + "\\node\\node.exe\"";
    QString arg1 = "\"" + dir.currentPath() + "\\node\\serverip\\serverip.js\"";

    proc.start(command + " " + arg1);
    proc.waitForFinished();

    serverIPAddress = proc.readAllStandardOutput();
    serverIPAddress = serverIPAddress.remove(serverIPAddress.length() - 1, 1);

    return "http://" + serverIPAddress + ":8888";
}


void MainWindow::on_btn_add_clicked()
{
    QString dir = QFileDialog::getExistingDirectory();

    if (dir.length() <= 0)
        return;

    CXmlManager::instance()->appendShareDir(dir);
    CXmlManager::instance()->saveXML();

    updateListwidget();
    return;
}

void MainWindow::on_btn_remove_clicked()
{
    // FIXME. get incorrect row when clicked with no one selected
    if ( ui->listWidget == NULL || ui == NULL)
        return;

    int row = ui->listWidget->currentRow();

    if (row < 0) {
        return;
    }

    CXmlManager::instance()->removeShareDir(row);
    CXmlManager::instance()->saveXML();

    updateListwidget();
    return;
}

void MainWindow::on_btn_startshare_clicked()
{
    QDir dir;
    QString command = "\"" + dir.currentPath() + "\\node\\node.exe\"";
    QString arg1 = "\"" + dir.currentPath() + "\\node\\public\\app.js\"";

    if (ui->btn_startshare->isEnabled() == true) {
        ui->btn_startshare->setEnabled(false);
        ui->btn_stopshare->setEnabled(true);
    }

    m_serverProc.setStandardErrorFile(dir.currentPath() + "\\error.log");
    m_serverProc.start(command + " " + arg1);

    return;
}

void MainWindow::on_btn_stopshare_clicked()
{
    if (ui->btn_stopshare->isEnabled() == true) {
        ui->btn_startshare->setEnabled(true);
        ui->btn_stopshare->setEnabled(false);
    }

    m_serverProc.kill();
    return;
}

void MainWindow::on_cb_dropbox_clicked()
{
    if (ui->cb_dropbox == NULL || ui == NULL)
        return;

    CXmlManager::instance()->updateDropbox(ui->cb_dropbox->checkState());
    return;

}
