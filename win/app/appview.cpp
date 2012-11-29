#include "appview.h"
#include "ui_appview.h"
#include <QPushButton>
#include <QXmlStreamWriter>
#include <QXmlStreamReader>
#include <QFile>
#include <QMessageBox>


AppView::AppView(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::AppView)
{
    ui->setupUi(this);
    setFixedSize(358, 640);

    connect(ui->btnplus, SIGNAL(clicked()), this, SLOT(insertSharedDir()));
    connect(ui->btnminus, SIGNAL(clicked()), this, SLOT(removeShareDir()));
}

AppView::~AppView()
{
    delete ui;
}

void AppView::setConnectAddr()
{
    ui->lb_addr->setText("http://192.168.0.1");
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
    new QListWidgetItem(QFileDialog::getExistingDirectory(), ui->listWidget);
    saveXML(ui->listWidget);

}

void AppView::removeSharedDir()
{
    int idx = ui->listWidget->currentRow();
    ui->listWidget->takeItem(idx);
}

void AppView::saveXML(QListWidget *qlist)
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
    int i=0;
    int sizeOfQlist = qlist->count();

    QFile file("./contacts.xml");
    if (!file.open(QIODevice::WriteOnly))
    {
        QMessageBox::warning(0, "Warning", "File is not created");
    }
    else
    {
        QXmlStreamWriter *xmlWriter = new QXmlStreamWriter();
        xmlWriter->setDevice(&file);
        xmlWriter->writeStartDocument();

        xmlWriter->writeStartElement("SHAREDDIR");

        for (i=0; i<sizeOfQlist; i++)
        {
            xmlWriter->writeStartElement("PATH");
            xmlWriter->writeCharacters(qlist->item(i)->text());
            xmlWriter->writeEndElement();
        }

        xmlWriter->writeEndElement();
        xmlWriter->writeEndDocument();

        delete xmlWriter;

    }
}
