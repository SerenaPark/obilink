#ifndef CXmlManager_H
#define CXmlManager_H

#include <QStringList>
#include <QProcess>
#include <QFile>

/* File     : xmlManager.h
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 2.0.1
 * Date     : 2013-02-07
 */

class CXmlManager
{
private:
    CXmlManager();
    ~CXmlManager();

    QStringList getXmlValue(QString xmlPath);               // return list of value by the element
    QString getDropboxInstalledPath();                      // return directory path of installed dropbox
    QString makeSymbolicPath(QString);                      // make symbolic directory
    QString makeSymbolicPath(QString, QString);             // make symbolic directory
    QString getSymbolicAbsoultePath(QString);               // return absolute path of symbolic directory

private:
    static CXmlManager* m_instance;
    QFile m_sharedDirListFile;                              // conf.xml
    QProcess m_lnProc;                                      // a process to make symbolic directory
    QProcess m_rjProc;                                      // a process to remove symbolic directory
    QStringList m_localShareDirList;                        // list of share directory path
    QStringList m_localSymbolicDirList;                     // list of symbolic path of share directory
    QString m_dropboxInstalledPath;                         // absolute path of installed dropbox
    bool m_dropboxShareMode;                                // true is dropbox is being shared

public:
    static CXmlManager* instance();
    static void destroy();
    bool saveXML();                                         // save share directory info to conf.xml
    bool loadXML();                                         // load share directory info from conf.xml
    QStringList getLocalShareDirList();
    QStringList getLocalSymbolicDirList();
    bool appendShareDir(QString);                           // append share directory path to list
    bool removeShareDir(int);                               // remove share directory path from list
    bool removeShareDir(QString);

    void updateDropbox(bool);
    bool isDropboxShareMode();                              // return m_dropboxShareMode
};

#endif // CXmlManager_H
