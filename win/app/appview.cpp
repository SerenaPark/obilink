#include "appview.h"
#include "ui_appview.h"
#include <QPushButton>
#include <QXmlStreamWriter>
#include <QXmlStreamReader>
#include <QFile>
#include <QMessageBox>
#include <QtNetwork/QNetworkInterface>

AppView::AppView(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::AppView),
    DBfile("./conf.xml")
{
    ui->setupUi(this);
    setFixedSize(358, 640);

    connect(ui->btnplus, SIGNAL(clicked()), this, SLOT(insertSharedDir()));
    connect(ui->btnminus, SIGNAL(clicked()), this, SLOT(removeSharedDir()));

    loadXML();
    getIPAddress();
}

AppView::~AppView()
{
    delete ui;
}

bool AppView::getIPAddress()
{
    QList<QHostAddress> ipList = QNetworkInterface::allAddresses();

    for (int i=0; i<ipList.size(); i++) {
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
    QString currentDir = QFileDialog::getExistingDirectory();
    if (currentDir != NULL) {
        new QListWidgetItem(currentDir, ui->listWidget);
        saveXML(ui->listWidget);
    }
}

void AppView::removeSharedDir()
{
    // Remove current index item from list && Update XML DB
    ui->listWidget->takeItem(ui->listWidget->currentRow());
    saveXML(ui->listWidget);
}

bool AppView::loadXML()
{
    QFile loadfile(DBfile);
    if (!loadfile.open(QIODevice::ReadOnly)) {
        QMessageBox::warning(0, "Warning", "File is not loaded");
        return false;
    }
    QXmlStreamReader xmlReader(&loadfile);

    while (!xmlReader.atEnd() && !xmlReader.hasError()) {
        QXmlStreamReader::TokenType token = xmlReader.readNext();
        if (token == QXmlStreamReader::StartDocument) {
            continue;
        }
        if (token == QXmlStreamReader::StartElement) {
            if (xmlReader.name() == "path") {
               new QListWidgetItem(xmlReader.readElementText(), ui->listWidget);
            }
            else {
               continue;
            }
        }
    }

    xmlReader.clear();
    loadfile.close();
    return true;
}

bool AppView::saveXML(QListWidget *qlist)
{
    QFile savefile(DBfile);
    if (!savefile.open(QIODevice::WriteOnly)) {
        QMessageBox::warning(0, "Warning", "File is not created");
        return false;
    }

    QXmlStreamWriter xmlWriter(&savefile);
    xmlWriter.writeStartDocument();
    xmlWriter.writeStartElement("shareddir");

    for (int i=0; i<qlist->count(); i++) {
        xmlWriter.writeStartElement("contents");
        xmlWriter.writeStartElement("path");
        xmlWriter.writeCharacters(qlist->item(i)->text());
        xmlWriter.writeEndElement();
        xmlWriter.writeStartElement("lnpath");
        xmlWriter.writeCharacters(qlist->item(i)->text());
        xmlWriter.writeEndElement();
        xmlWriter.writeEndElement();
    }

    xmlWriter.writeEndElement();
    xmlWriter.writeEndDocument();
    savefile.close();
    return true;
}
