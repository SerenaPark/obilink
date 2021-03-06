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
#include <QStandardPaths>

#define kor(str) QString::fromLocal8Bit(str)

/* File     : mainwindow.cpp
 * Author   : Edgar Seo, Ted Kim
 * Company  : OBIGO KOREA
 * Version  : 2.1.8
 * Date     : 2013-03-27
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
    m_resolution = menuBar()->addMenu(kor("화면크기"));

    QAction *deleteCache = new QAction(kor("&캐시삭제"), this);
    QAction *resolution_type01 = new QAction(kor("&1024x768"), this);
    QAction *resolution_type02 = new QAction(kor("&640x480"), this);
    QAction *resolution_type03 = new QAction(kor("&480x320"), this);

    resolution_type01->setCheckable(true);
    resolution_type02->setCheckable(true);
    resolution_type03->setCheckable(true);
    resolution_type02->setChecked(true);

    m_cacheManager->addAction(deleteCache);
    m_resolution->addAction(resolution_type01);
    m_resolution->addAction(resolution_type02);
    m_resolution->addAction(resolution_type03);

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

    // Set dropbox share if dropbox is installed and used dropbox share in the past
    if (CXmlManager::instance()->isDropboxShareMode()) {
        ui->cb_dropbox->setChecked(CXmlManager::instance()->isDropboxInstalled());
        CXmlManager::instance()->updateDropbox(CXmlManager::instance()->isDropboxInstalled());
    }

    updateShareAddress();
    updateListwidget();
    updateShareSymbolicDir();
    updateVideoResolutionSetting();

    return;
}

void MainWindow::updateVideoResolutionSetting()
{
    // Claer menu check flag
    QList<QAction*> actionList = m_resolution->actions();
    for (int i = 0; i < actionList.size(); i++) {
        actionList[i]->setChecked(false);
    }

    // Load setting file and set window menu flag
    QString video_setting = CXmlManager::instance()->loadSetting();

    if (video_setting == "TYPE01") {
        actionList[0]->setChecked(true);
    } else if (video_setting == "TYPE02") {
        actionList[1]->setChecked(true);
    } else if (video_setting == "TYPE03") {
        actionList[2]->setChecked(true);
    } else {
        qDebug() << "Error in updateVideoResoulutionSetting()" << endl;
    }

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
    ui->tb_addr->setText(addr);
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
    /* Exception */
    if (ui->btn_stopshare->isEnabled()) {
        QMessageBox::information(0, kor("알림"), kor("공유 중입니다. 공유중지 버튼을 누르고 눌러주세요."));
        return;
    }

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
    /* Exception */
    if (ui->btn_stopshare->isEnabled()) {
        QMessageBox::information(0, kor("알림"), kor("공유 중입니다. 공유중지 버튼을 누르고 눌러주세요."));
        return;
    }

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

    if (ui->btn_startshare->isEnabled()) {
        ui->btn_startshare->setEnabled(false);
        ui->btn_stopshare->setEnabled(true);
    }

    m_cacheManager->setEnabled(false);
    m_resolution->setEnabled(false);

    qDebug() << "start again" << endl;
    m_serverProc.setStandardErrorFile(dir.currentPath() + "\\error.log");
    m_serverProc.start(command + " " + arg1);

    ui->btn_startshare->setStyleSheet("background-image: url(:/images/images/btn_start_p.png);""border-style: outset;");
    ui->btn_stopshare->setStyleSheet("#btn_stopshare{background-image: url(:/images/images/btn_stop_n.png);border-style: outset;}"
                                     "#btn_stopshare:pressed{background-image: url(:/images/images/btn_stop_p.png);border-style: outset;}");

    updateShareAddress();
    return;
}

void MainWindow::on_btn_stopshare_clicked()
{
    if (ui->btn_stopshare->isEnabled()) {
        ui->btn_startshare->setEnabled(true);
        ui->btn_stopshare->setEnabled(false);
    }

    m_cacheManager->setEnabled(true);
    m_resolution->setEnabled(true);

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
    /* Exception */
    if (ui->cb_dropbox == NULL || ui == NULL)
        return;

    // Disable state change when sharing contents
    if (ui->btn_stopshare->isEnabled()) {
        QMessageBox::information(0, kor("알림"), kor("공유 중입니다. 공유중지 버튼을 누르고 눌러주세요."));
        ui->cb_dropbox->setChecked(!ui->cb_dropbox->isChecked());
        return;
    }

    bool canDropboxShare = ui->cb_dropbox->checkState();
    // Inactivate dropbox share when dropbox is not installed and user do not select installed dropbox path.
    if (canDropboxShare
        && !CXmlManager::instance()->isDropboxInstalled()
        && !popYESNOMessageBox(1)) {
            ui->cb_dropbox->setChecked(false);
            QMessageBox::information(0, kor("알림"), kor("드랍박스 공유가 취소되었습니다."));
            canDropboxShare = false;
    }
    CXmlManager::instance()->updateDropbox(canDropboxShare);
    return;
}

bool MainWindow::popYESNOMessageBox(int type)
{
    QString dropboxPath;

    if (type == 1) {
        if (QMessageBox::Yes == QMessageBox::question(0, kor("알림"), kor("설치된 드랍박스를 찾을 수 없습니다. 직접 지정하시겠습니까?"), QMessageBox::Yes|QMessageBox::No)) {
            dropboxPath = QFileDialog::getExistingDirectory(this, kor("드랍박스가 설치된 폴더를 선택해 주세요."), "/", QFileDialog::ReadOnly | QFileDialog::ShowDirsOnly | QFileDialog::DontResolveSymlinks);
        }
        if (dropboxPath != NULL) {
            CXmlManager::instance()->setDropboxInstalledPath(dropboxPath);
            return true;
        }
    }
    return false;
}

void MainWindow::processFinished(int exitCode, QProcess::ExitStatus exitStatus)
{
    // Error 코드가 왜 거꾸로 응답되는지 분석필요.
    if (exitStatus == QProcess::NormalExit) {
        qDebug() << "Node.js is exited abnormally" << endl;
        on_btn_stopshare_clicked();
    } else if (exitStatus == QProcess::CrashExit) {
        qDebug() << "Node.js is exited normally" << endl;
    }
}

void MainWindow::deleteCache()
{
    /* remove all cache */
    if(CXmlManager::instance()->removeDirectory(QDir::QDir("node/public/cache")))
        QMessageBox::information(0, kor("알림"), kor("모든 캐시가 성공적으로 삭제되었습니다."));

    return;

}

void MainWindow::selectResolution(QAction* act)
{
    QString resolution;
    QList<QAction*> actionList = m_resolution->actions();
    for (int i = 0; i < actionList.size(); i++) {
        actionList[i]->setChecked(false);
    }

    act->setChecked(true);

    if (act->text() == kor("&1024x768")) {
        resolution = "TYPE01";
    } else if (act->text() == kor("&640x480")) {
        resolution = "TYPE02";
    } else if (act->text() == kor("&480x320")) {
        resolution = "TYPE03";
    } else {
        qDebug() << "Error in selectResolution()" << endl;
    }

    CXmlManager::instance()->saveSetting(resolution);

    return;
}

