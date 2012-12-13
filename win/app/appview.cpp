#include "appview.h"
#include "ui_appview.h"
#include <QPushButton>
#include <QXmlStreamWriter>
#include <QXmlStreamReader>
#include <QFile>
#include <QtNetwork/QNetworkInterface>


AppView::AppView(QWidget *parent) :
    ui(new Ui::AppView)
{
    ui->setupUi(this);
    setFixedSize(358, 640);

    connect(ui->btnplus, SIGNAL(clicked()), this, SLOT(insertSharedDir()));
    connect(ui->btnminus, SIGNAL(clicked()), this, SLOT(removeSharedDir()));

    //ui->btnplus->setFocusPolicy(Qt::NoFocus);

    loadXML(ui);
    getIPAddress();
}

bool AppView::saveXML(QListWidget *qlist)
{
    /* Sample Code */
    /*
    <int to QString>
    QString tmp2;
    tmp2.setNum(sizeOfQlist);
    ui->lb_addr->setText(tmp2);

    <Use QMessageBox>
    QMessageBox::warning(0, "TEST", qlist->item(i)->text());

    <Read QListWidgetItem Text>
    ui->lb_addr->setText(qlist->item(i)->text());
    */

    QFile savefile(DBFILE);
    if (!savefile.open(QIODevice::WriteOnly)) {
        QMessageBox::warning(0, "Warning", "File is not created");
        return false;
    }

    QXmlStreamWriter xmlWriter(&savefile);
    xmlWriter.writeStartDocument();
    xmlWriter.writeStartElement("SHAREDDIR");

    for (int i=0; i<qlist->count(); i++) {
        xmlWriter.writeStartElement("PATH");
        xmlWriter.writeCharacters(qlist->item(i)->text());
        xmlWriter.writeEndElement();
    }

    xmlWriter.writeEndElement();
    xmlWriter.writeEndDocument();
    savefile.close();
    return true;
}

bool AppView::loadXML(Ui::AppView *ui)
{
    QFile loadfile(DBFILE);
    if (!loadfile.open(QIODevice::ReadOnly)) {
        QMessageBox::warning(0, "Warning", "DB File is not loaded");
        return false;
    }
    QXmlStreamReader xmlReader(&loadfile);

    while (!xmlReader.atEnd() && !xmlReader.hasError()) {
        QXmlStreamReader::TokenType token = xmlReader.readNext();
        if (token == QXmlStreamReader::StartDocument) {
            continue;
        }
        if (token == QXmlStreamReader::StartElement) {
            if (xmlReader.name() == "SHAREDDIR") {
                continue;
            }
            if (xmlReader.name() == "PATH") {
               new QListWidgetItem(xmlReader.readElementText(), ui->listWidget);
            }
        }
    }

    xmlReader.clear();
    loadfile.close();
    return true;
}

AppView::~AppView()
{
    delete ui;
}

bool AppView::getIPAddress()
{
    QList<QHostAddress> ipList = QNetworkInterface::allAddresses();

    // Preliminary Code
    /*
    for (int i=0; i<ipList.size(); i++) {
        if (ipList.at(i) != QHostAddress::LocalHost && ipList.at(i).toIPv4Address()) {
            new QListWidgetItem(ipList.at(i).toString(), ui->listWidget);
        }
    }
    */
    for (int i=0; i!=ipList.size(); i++) {
        // Filter for IPv4 Type Address without local loop address(127.0.0.1)
        if (ipList.at(i) != QHostAddress::LocalHost && ipList.at(i).toIPv4Address()) {
            if (ipList.at(i).toString() != NULL) {
                return setConnectAddr(ipList.at(i).toString());
            }
        }
    }
    return false;
}

bool AppView::setConnectAddr(QString addr)
{
    ui->lb_addr->setText(addr.append(" : 8080"));
    return true;
}

void AppView::insertSharedDir()
{
    /* Sample Code */
    /*
        <Open Dir Explorer>
        QFileDialog *file = new QFileDialog(this);
        file->setFileMode(QFileDialog::Directory);
        file->exec();
    */

    QString currentDir = QFileDialog::getExistingDirectory();
    if (currentDir != NULL) {
        new QListWidgetItem(currentDir, ui->listWidget);
        AppView::saveXML(ui->listWidget);
    }
}

void AppView::removeSharedDir()
{
    // Remove current index item from list && Update XML DB
    ui->listWidget->takeItem(ui->listWidget->currentRow());
    AppView::saveXML(ui->listWidget);
}

