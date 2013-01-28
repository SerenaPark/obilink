#include "droplistwidget.h"
#include "xmlManager.h"

/* File     : droplistwidget.cpp
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 1.0
 * Date     : 2013-01-25
 */

DropListWidget::DropListWidget(QWidget *parent)
    : QListWidget(parent)
{
}

bool DropListWidget::dropMimeData(int index, const QMimeData *data, Qt::DropAction action)
{
    QList<QUrl> urlList;
    QFileInfo info;
    QString dirName;

    urlList = data->urls(); // retrieve list of urls

    foreach(QUrl url, urlList) {// iterate over list
        dirName = url.toLocalFile();
        info.setFile(dirName);

        if(!CXmlManager::instance()->getLocalShareDirList().contains(dirName)
            && info.isDir()) {
            CXmlManager::instance()->appendShareDir(dirName);
        }
    }

    CXmlManager::instance()->saveXML();

    clear();
    addItems(CXmlManager::instance()->getLocalShareDirList());

    return true;
}


QStringList DropListWidget::mimeTypes () const
{
    QStringList qstrList;
    // list of accepted mime types for drop
    qstrList.append("text/uri-list");
    return qstrList;
}


Qt::DropActions DropListWidget::supportedDropActions () const
{
    return Qt::CopyAction;
}


