#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "xmlManager.h"
#include <QtNetwork/QNetworkInterface>
#include <QFileDialog>
#include <QMessageBox>
#include <QMenu>
#include <QMenuBar>
#include <QAction>
#include <QTextCodec>
#include <QTextStream>

#define kor(str) QString::fromLocal8Bit(str)

/* File     : mainwindow.cpp
 * Author   : Edgar Seo, Ted Kim
 * Company  : OBIGO KOREA
 * Version  : 2.1.0
 * Date     : 2013-03-13
 */

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);
    ui->lb_qrcode->setStyleSheet("background-image: url(:/images/images/qr.png);");

    // Fix window size & disable cursor at border of window
    Qt::WindowFlags flags = Qt::Window | Qt::MSWindowsFixedSizeDialogHint;
    setWindowFlags(flags);
    setFixedSize(360, 660);
    statusBar()->hide();

    // Menu Bar
    m_cacheManager = menuBar()->addMenu(kor("캐시관리"));
    m_resolution = menuBar()->addMenu(kor("동영상 화질"));

    QAction *deleteCache = new QAction(kor("&캐시삭제"), this);
    QAction *resolution_high = new QAction(kor("&고화질"), this);
    QAction *resolution_mid = new QAction(kor("&중화질(기본값)"), this);
    QAction *resolution_low = new QAction(kor("&저화질"), this);

    resolution_high->setCheckable(true);
    resolution_mid->setCheckable(true);
    resolution_low->setCheckable(true);
    resolution_mid->setChecked(true);

    m_cacheManager->addAction(deleteCache);
    m_resolution->addAction(resolution_high);
    m_resolution->addAction(resolution_mid);
    m_resolution->addAction(resolution_low);


    connect(&m_serverProc, SIGNAL(finished(int, QProcess::ExitStatus)), this, SLOT(processFinished(int, QProcess::ExitStatus)));
    connect(deleteCache, SIGNAL(triggered()), this, SLOT(deleteCache()));
    connect(m_resolution, SIGNAL(triggered(QAction*)), this, SLOT(selectResolution(QAction*)));

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
    updateVideoResolutionSetting();

    return;
}

void MainWindow::updateVideoResolutionSetting()
{
    // Claer
    QList<QAction*> actionList = m_resolution->actions();
    for (int i = 0; i < actionList.size(); i++) {
        actionList[i]->setChecked(false);
    }

    // Read File Infomation
    QFile file("video_setting");
    if (!file.open(QIODevice::ReadOnly)) {
        qDebug() << "File is not exist. create new file" << endl;
        writeSetting(kor("&중화질"));
        actionList[1]->setChecked(true);
        return;
    }

    QTextStream in(&file);
    while (!in.atEnd()) {
        QString line = in.readLine();
        if (line.contains("HIGH")) {
            actionList[0]->setChecked(true);
        } else if (line.contains("MID")) {
            actionList[1]->setChecked(true);
        } else if (line.contains("LOW")){
            actionList[2]->setChecked(true);
        }
    }
    file.close();
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

    QList<QAction*> act = m_cacheManager->actions();
    act[0]->setEnabled(false);

    qDebug() << "start again" << endl;
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

    QList<QAction*> act = m_cacheManager->actions();
    act[0]->setEnabled(true);

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
        QMessageBox::information(0, kor("알림"), kor("드랍박스가 설치되어 있지 않습니다."));
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

void MainWindow::deleteCache()
{
    /* remove all cache */
    QDir dir;
    dir.rmdir("node\\public\\cache\\audio");
    dir.rmdir("node\\public\\cache\\video");
    QMessageBox::information(0, kor("알림"), kor("모든 캐시가 성공적으로 삭제되었습니다."));
}

void MainWindow::selectResolution(QAction* act)
{
    QList<QAction*> actionList = m_resolution->actions();
    for (int i = 0; i < actionList.size(); i++) {
        actionList[i]->setChecked(false);
    }

    act->setChecked(true);
    writeSetting(act->text());
}

void MainWindow::writeSetting(QString str)
{
    QFile *file = new QFile;
    file->setFileName("video_setting");
    file->open(QIODevice::WriteOnly);
    file->write("{");
    file->write("\n");

    if (str == kor("&고화질")) {
        file->write("\"video_resolution_type\" : \"HIGH\"");
        file->write("\n");
        file->write("\"video_resolution_size\" : \"1024x768\"");
    } else if (str == kor("&중화질(기본값)")) {
        file->write("\"video_resolution_type\" : \"MID\"");
        file->write("\n");
        file->write("\"video_resolution_size\" : \"640x480\"");
    } else {
        file->write("\"video_resolution_type\" : \"LOW\"");
        file->write("\n");
        file->write("\"video_resolution_size\" : \"480x320\"");
    }

    file->write("\n");
    file->write("}");
    file->close();
}
