#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "xmlManager.h"
#include <QtNetwork/QNetworkInterface>
#include <QFileDialog>
#include <QMessageBox>

/* File     : mainwindow.cpp
 * Author   : Edgar Seo, Ted Kim
 * Company  : OBIGO KOREA
 * Version  : 2.0.5
 * Date     : 2013-02-18
 */

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);
    ui->lb_qrcode->setStyleSheet("background-image: url(:/images/images/qr.png);");

    connect(&m_serverProc, SIGNAL(finished(int, QProcess::ExitStatus)), this, SLOT(processFinished(int, QProcess::ExitStatus)));

    // fix window size & disable cursor at border of window
    Qt::WindowFlags flags = Qt::Window | Qt::MSWindowsFixedSizeDialogHint;
    setWindowFlags(flags);
    setFixedSize(360, 640);
    statusBar()->hide();

    initialize();
}


MainWindow::~MainWindow()
{
    CXmlManager::instance()->removeAllSymbolDir();
    CXmlManager::destroy();
    delete ui;
}


void MainWindow::initialize()
{
    CXmlManager::instance()->loadXML();

    ui->btn_stopshare->setEnabled(false);

    if (CXmlManager::instance()->isDropboxShareMode()) {
        if (CXmlManager::instance()->isDropboxInstalled()) {
            ui->cb_dropbox->setChecked(true);
        } else {
            CXmlManager::instance()->updateDropbox(false);
        }
    }

    updateShareAddress();
    updateListwidget();
    updateShareSymbolicDir();

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

void MainWindow::updateShareSymbolicDir()
{
    CXmlManager::instance()->updateShareSymbolicDir();
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
    ui->lb_qrcode->setMargin(2);
    ui->lb_qrcode->setPixmap(QPixmap::QPixmap(qrcodePath).scaled(106, 106, Qt::KeepAspectRatio));

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
    QDir dirlist;
    QString dir = QFileDialog::getExistingDirectory(this,
                        tr("Choose Share Directory"),
                        "/",
                        QFileDialog::ReadOnly | QFileDialog::ShowDirsOnly | QFileDialog::DontResolveSymlinks);


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

    ui->btn_startshare->setStyleSheet("background-image: url(:/images/images/btn_start_p.png);""border-style: outset;");
    ui->btn_stopshare->setStyleSheet("#btn_stopshare{background-image: url(:/images/images/btn_stop_n.png);border-style: outset;}"
                                     "#btn_stopshare:pressed{background-image: url(:/images/images/btn_stop_p.png);border-style: outset;}");
    return;
}

void MainWindow::on_btn_stopshare_clicked()
{
    if (ui->btn_stopshare->isEnabled() == true) {
        ui->btn_startshare->setEnabled(true);
        ui->btn_stopshare->setEnabled(false);
    }

    m_serverProc.kill();      // return CrashExit
    //m_serverProc.close();       // return CrashExit
    //m_serverProc.terminate();

    ui->btn_startshare->setStyleSheet("#btn_startshare{background-image: url(:/images/images/btn_start_n.png);border-style: outset;}"
                                      "#btn_startshare:pressed{background-image: url(:/images/images/btn_start_p.png);;border-style: outset;}");
    ui->btn_stopshare->setStyleSheet("background-image: url(:/images/images/btn_stop_p.png);""border-style: outset;");
    return;
}

void MainWindow::on_cb_dropbox_clicked()
{
    if (ui->cb_dropbox == NULL || ui == NULL)
        return;

    if (CXmlManager::instance()->isDropboxInstalled())
        CXmlManager::instance()->updateDropbox(ui->cb_dropbox->checkState());
    else {
        ui->cb_dropbox->setChecked(false);
        QMessageBox::information(0, "ALARM", "The dropbox is not installed.");
    }

    return;

}

void MainWindow::processFinished(int exitCode, QProcess::ExitStatus exitStatus)
{
    if (ui->btn_stopshare->isEnabled()) {
        ui->btn_startshare->setEnabled(true);
        ui->btn_stopshare->setEnabled(false);
    }

    if (exitStatus == QProcess::NormalExit) {
        qDebug() << "Node.js is exited normally" << endl;
    } else if (exitStatus == QProcess::CrashExit) {
        qDebug() << "Node.js is exited abnormally" << endl;
    }
}
