#include "shareDir.h"
#include "xmlManager.h"
#include <QString>

/* File     : shareDir.cpp
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 1.0.2
 * Date     : 2013-01-22
 */

QStringList ShareDir::m_localShareDirList;
QStringList ShareDir::m_localShareDirlinkList;
QString ShareDir::m_dropboxDir = "";
QString ShareDir::m_dropboxDirlink = "";
bool ShareDir::m_isSharedDropBox;

ShareDir::ShareDir()
{
}

ShareDir::~ShareDir()
{
}

bool ShareDir::isDuplicated(QString str)
{
    bool res = false;

    if (str == NULL)
        return res;

    for (int i = 0; i < m_localShareDirList.size(); i++) {
        if (m_localShareDirList[i] == str) {
            res = true;
            break;
        }
    }
    return res;
}

bool ShareDir::appendShareDir(QString targetPath)
{
    bool res = false;

    if (targetPath == NULL)
            return res;

    m_localShareDirList.append(targetPath);
    m_localShareDirlinkList.append(makeSoftlinkPath(targetPath));
    res = true;

    return res;
}

bool ShareDir::removeShareDir(int row)
{
    QString selectedDirName;

    if (row < 0 || row >= m_localShareDirList.size()) {
        return false;
    }

    selectedDirName = m_localShareDirlinkList[row];

    m_localShareDirList.removeAt(row);
    m_localShareDirlinkList.removeAt(row);

    QDir dir;
    dir.rmdir(selectedDirName);


    return true;
}


QString ShareDir::makeSoftlinkPath(QString targetPath)
{
    QString softlinkPath = targetPath;
    softlinkPath.remove(0, 3).replace("/", "_").replace(" ", "_");

    return makeSoftlinkPath(softlinkPath, targetPath);
}


QString ShareDir::makeSoftlinkPath(QString softlinkPath, QString targetPath)
{
    // FIXME. makeSoftlinkPath() do not work in Korean directory name
    QString command;
    QDir dir;

    targetPath = " \"C:\\" + targetPath.remove(0, 3).replace("/", "\\") + "\"";
    command = "mklink /D " + dir.currentPath() + "\\node\\public\\contents\\" + softlinkPath + targetPath;

    const char *makeSoftlinkCommand = command.toLatin1().data();
    system(makeSoftlinkCommand);

    return softlinkPath;
}

void ShareDir::updateDropbox(bool checked)
{
    // FIXME. add exception for case of dropbox did not installed
     if (checked) {
        m_dropboxDir = getDropboxDir();
        m_dropboxDirlink = makeSoftlinkPath("dropbox", m_dropboxDir);
    } else {
        QDir dir;
        dir.rmdir("dropbox");

        m_dropboxDir = "";
        m_dropboxDirlink = "";
    }

    m_isSharedDropBox = checked;
    CXmlManager::instance()->saveXML();

    return;
}

QString ShareDir::getDropboxDir()
{
    if (m_dropboxDir != "") {
        return m_dropboxDir;
    }

    QString accountName = getenv("USERNAME");
    QString dropboxSoftlinkPath = "C:\\Users\\" + accountName + "\\Links\\Dropbox.lnk";
    QFileInfo dropboxLink(dropboxSoftlinkPath);

    return dropboxLink.symLinkTarget();
}

bool ShareDir::isSharedDropbox()
{
    return m_isSharedDropBox;
}

void ShareDir::setSharedDropboxMode(bool checked)
{
    m_isSharedDropBox = checked;
}

QStringList ShareDir::getLocalShareDirList()
{
    return m_localShareDirList;
}

QStringList ShareDir::getLocalShareDirlinkList()
{
    return m_localShareDirlinkList;
}

QString ShareDir::getDropboxDirlink()
{
    return m_dropboxDirlink;
}

void ShareDir::setLocalShareDirList(QString path)
{
    m_localShareDirList.append(path);
    return;
}

void ShareDir::setLocalShareDirlinkList(QString path)
{
    m_localShareDirlinkList.append(path);
    return;
}

void ShareDir::setLocalShareDirList(QStringList path)
{
    for (int i = 0; i < path.size(); i++) {
        m_localShareDirList.append(path[i]);
    }
    return;
}

void ShareDir::setLocalShareDirlinkList(QStringList path)
{
    for (int i = 0; i < path.size(); i++) {
        m_localShareDirlinkList.append(path[i]);
    }
    return;
}

