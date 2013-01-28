#ifndef MYLISTWIDGET_H
#define MYLISTWIDGET_H

/* File     : droplistwidget.h
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 1.0
 * Date     : 2013-01-25
 */

#include <QtGui>
#include <QListWidget>

namespace Ui {
class DropListWidget;
}

class DropListWidget : public QListWidget
{
    Q_OBJECT

public:
    DropListWidget(QWidget *parent = 0);

    virtual bool dropMimeData(int index, const QMimeData *data, Qt::DropAction action);
    QStringList mimeTypes() const;
    Qt::DropActions supportedDropActions () const;

private:
    QPoint dragStartPosition;
};


#endif // MYLISTWIDGET_H
