#ifndef MYLISTWIDGET_H
#define MYLISTWIDGET_H

#include <QtGui>
#include "appview.h"

namespace Ui {
class myListWidget;
}

class myListWidget : public QListWidget
{
    Q_OBJECT

public:
    myListWidget(QWidget *parent = 0);

    virtual bool dropMimeData(int index, const QMimeData *data, Qt::DropAction action);
    QStringList mimeTypes() const;
    Qt::DropActions supportedDropActions () const;

    void mouseMoveEvent(QMouseEvent *event);

private:
    QPoint dragStartPosition;
};


#endif // MYLISTWIDGET_H
