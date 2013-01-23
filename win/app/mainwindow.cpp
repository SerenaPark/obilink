#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "xmlManager.h"
#include "shareDir.h"
#include <QtNetwork/QNetworkInterface>
#include <QFileDialog>
#include <QProcess>

/* File     : mainwindow.cpp
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 1.1.0
 * Date     : 2013-01-22
 */


MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    // disable cursor at border of window
    Qt::WindowFlags flags = Qt::Window | Qt::MSWindowsFixedSizeDialogHint;
    setWindowFlags(flags);

    setFixedSize(358, 544);

    connect(ui->btn_add, SIGNAL(clicked()), this, SLOT(insertSharedDir()));
    connect(ui->btn_remove, SIGNAL(clicked()), this, SLOT(removeSharedDir()));
    connect(ui->btn_startshare, SIGNAL(clicked()), this, SLOT(startShare()));
    connect(ui->btn_stopshare, SIGNAL(clicked()), this, SLOT(stopShare()));
    connect(ui->cb_dropbox, SIGNAL(clicked()), this, SLOT(shareDropbox()));

    initialize();
}

MainWindow::~MainWindow()
{
    CXmlManager::destroy();
    delete ui;
}

void MainWindow::initialize()
{
    ShareDir sharedir;

    CXmlManager::instance()->loadXML();

    ui->cb_dropbox->setChecked(sharedir.isSharedDropbox());
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
    ShareDir sharedir;
    ui->listWidget->clear();

    for (int i = 0; i < sharedir.getLocalShareDirList().size(); i++) {
        new QListWidgetItem(sharedir.getLocalShareDirList()[i], ui->listWidget);
    }

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

    QProcess::execute(dir.currentPath() + "\\extbin\\qrcode -o " + dir.currentPath() + "\\extbin\\qrcodepic.png -s 5 -l H " + addr);
    ui->lb_qrcode->setPixmap(QPixmap::QPixmap(dir.currentPath() + "\\extbin\\qrcodepic.png").scaled(100, 100, Qt::KeepAspectRatio));

    return;
}



QString MainWindow::getIPAddress()
{
    QList<QHostAddress> ipList = QNetworkInterface::allAddresses();

    for (int i = 0; i != ipList.size(); i++) {
        // Filter for IPv4 Type Address without local loop address(127.0.0.1)
        if (ipList.at(i) != QHostAddress::LocalHost && ipList.at(i).toIPv4Address()) {
            if (ipList.at(i).toString() != NULL) {
                return "http://" + ipList.at(i).toString() + ":8080";
            }
        }
    }
    return "Not available";
}

void MainWindow::insertSharedDir()
{
    ShareDir sharedir;
    QString currentDir = QFileDialog::getExistingDirectory();

    if (currentDir != NULL && !sharedir.isDuplicated(currentDir)) {
        sharedir.appendShareDir(currentDir);
    }

    CXmlManager::instance()->saveXML();
    updateListwidget();

    return;
}

void MainWindow::removeSharedDir()
{
    // FIXME. this function remove first element, if no one selected when clicked.
    int row = ui->listWidget->currentRow();

    if ( row < 0) {
        return;
    }

    ShareDir sharedir;
    sharedir.removeShareDir(row);

    CXmlManager::instance()->saveXML();
    updateListwidget();

    return;
}

void MainWindow::startShare()
{
    //FIXME. add exception for not exist of Node.js server
    QDir dir;

    if (ui->btn_startshare->isEnabled() == true) {
        ui->btn_startshare->setEnabled(false);
        ui->btn_stopshare->setEnabled(true);
    }

    ui->btn_startshare->setEnabled(false);

    m_serverProc.setWorkingDirectory(dir.currentPath() + "\\node");
    m_serverProc.setStandardErrorFile(dir.currentPath() + "\\error.txt");

    m_serverProc.start(dir.currentPath() + "\\node\\node.exe " + dir.currentPath() + "\\node\\public\\app.js");

    qDebug() << m_serverProc.state();
    return;
}

void MainWindow::stopShare()
{
    if (ui->btn_stopshare->isEnabled() == true) {
        ui->btn_startshare->setEnabled(true);
        ui->btn_stopshare->setEnabled(false);
    }

    m_serverProc.kill();
    return;
}

void MainWindow::shareDropbox()
{
    ShareDir shareDir;
    shareDir.updateDropbox(ui->cb_dropbox->checkState());

    return;
}






