#ifndef CXmlManager_H
#define CXmlManager_H

#include <QStringList>
#include <QProcess>
#include <QFile>
#include <QDir>

/* File     : xmlManager.h
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 2.0.4
 * Date     : 2013-03-19
 */

class CXmlManager
{
private:
    CXmlManager();
    ~CXmlManager();

    QStringList getXmlValue(QString xmlPath);               // return list of value by the element
    QString getDropboxInstalledPath();                      // return directory path of installed dropbox
    QString getObilinkDropboxInstalledPath();
    QString makeSymbolicPath(QString);                      // make symbolic directory
    QString makeSymbolicPath(QString, QString);             // make symbolic directory
    QString getSymbolicAbsoultePath(QString);               // return absolute path of symbolic directory

private:
    static CXmlManager* m_instance;
    QFile m_sharedDirListFile;                              // conf.xml
    QFile m_settingFile;
    QProcess m_lnProc;                                      // a process to create symbolic directory
    QProcess m_rjProc;                                      // a process to remove symbolic directory
    QStringList m_localShareDirList;                        // list of share directory path
    QStringList m_localSymbolicDirList;                     // list of symbolic path of share directory
    bool m_dropboxShareMode;                                // true is dropbox is being shared

public:
    static CXmlManager* instance();
    static void destroy();
    bool saveXML();                                         // save share directory info to conf.xml
    bool loadXML();                                         // load share directory info from conf.xml
    bool saveSetting(QString setting);                      // save video resoultion setting to setting file
    QString loadSetting();                                  // load video resoultion setting from setting file
    QStringList getLocalShareDirList();
    QStringList getLocalSymbolicDirList();
    bool appendShareDir(QString);                           // append share directory path to list
    bool removeShareDir(int);                               // remove share directory path from list1
    bool removeShareDir(QString);
    bool removeAllSymbolDir();
    bool removeDirectory(QDir);

    void updateDropbox(bool);
    void updateShareSymbolicDir();                          //
    bool isDropboxShareMode();                              // return m_dropboxShareMode
    bool isDropboxInstalled();                              // return true, if dropbox installed in the local computer
};

#endif // CXmlManager_H
