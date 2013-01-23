#ifndef SHAREDIR_H
#define SHAREDIR_H

#include <QStringList>
#include <QDir>

/* File     : shareDir.h
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 1.0
 * Date     : 2013-01-15
 */

class ShareDir
{
private:
    QString makeSoftlinkPath(QString targetPath);                                       // make softlink & return softlink path
    QString makeSoftlinkPath(QString softlinkPath, QString targetPath);

private:
    static QStringList m_localShareDirList;                                             // contain all local share directory path
    static QStringList m_localShareDirlinkList;                                         // contain all symbolic path for accessing local share directory
    static QString m_dropboxDir;                                                        // installed dropbox path
    static QString m_dropboxDirlink;                                                    // Symbolic path for accessing dropbox
    static bool m_isSharedDropBox;                                                      // dropbox share mode

public:
    ShareDir();
    ~ShareDir();
    bool isDuplicated (QString str);                                                    // check the path whether it's already exist in share list
    bool appendShareDir (QString targetPath);                                           // append new share path to list
    bool removeShareDir (int row);                                                      // remove selected share path from list
    void updateDropbox(bool checked);                                                   // update share state depend on dropbox mode

    bool isSharedDropbox();                                                             // return true if dropbox shared
    void setSharedDropboxMode(bool checked);                                            // set m_isSharedDropBox value whether dropbox is shared or not
    QString getDropboxDir();                                                            // return installed dropbox path from symbolic link
    QString getDropboxDirlink();                                                        // return link path to accessing dropbox

    QStringList getLocalShareDirList();                                                 // return m_localShareDirList
    QStringList getLocalShareDirlinkList();                                             // return m_localShareDirlinkList
    void setLocalShareDirList(QString path);                                            // append new path to m_localShareDirList
    void setLocalShareDirlinkList(QString path);                                        // append new path to m_localShareDirlinkList
    void setLocalShareDirList(QStringList path);                                        // append new path to m_localShareDirList
    void setLocalShareDirlinkList(QStringList path);                                    // append new path to m_localShareDirlinkList
};

#endif // SHAREDIR_H
