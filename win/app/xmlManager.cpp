#include "xmlManager.h"
#include <QtXmlPatterns/QXmlQuery>
#include <QXmlStreamWriter>
#include <QXmlStreamReader>
#include <QXmlQuery>
#include <QMessageBox>
#include <QDir>
#include <QDebug>
#include <Windows.h>
#include <QDesktopServices>

/* File     : xmlManager.cpp
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 2.1.1
 * Date     : 2013-03-22
 */

CXmlManager* CXmlManager::m_instance = NULL;

CXmlManager::CXmlManager() :
    m_sharedDirListFile("./conf.xml"),
    m_settingFile("./setting"),
    m_dropboxShareMode(false)
{
}


CXmlManager::~CXmlManager()
{
}


CXmlManager* CXmlManager::instance()
{
    if (!m_instance)
        m_instance = new CXmlManager;

    return m_instance;
}


void CXmlManager::destroy()
{
    if (m_instance) {
        delete m_instance;
        m_instance = NULL;
    }
}

QString CXmlManager::loadSetting()
{
    QString video_resolution_type = "TYPE02";      // Default video setting value
    if (!m_settingFile.open(QIODevice::ReadOnly)) {
        qDebug() << "Setting File is not exist. Create new setting file now" << endl;
        if (saveSetting("TYPE02")) {
            return video_resolution_type;
        }
    }

    QTextStream in(&m_settingFile);
    while (!in.atEnd()) {
        QString line = in.readLine();
        if (line.contains("TYPE01")) {
            video_resolution_type = "TYPE01";
        } else if (line.contains("TYPE02")) {
            video_resolution_type = "TYPE02";
        } else if (line.contains("TYPE03")) {
            video_resolution_type = "TYPE03";
        } else {
            qDebug() << "No Match in loadSetting()" << endl;
        }
    }

    m_settingFile.close();
    return video_resolution_type;
}

bool CXmlManager::saveSetting(QString setting)
{
    m_settingFile.open(QIODevice::WriteOnly);

    m_settingFile.write("{");
    m_settingFile.write("\n");

    if (setting == "TYPE01") {
        m_settingFile.write("\"video_frame_type\" : \"TYPE01\",");
        m_settingFile.write("\n");
        m_settingFile.write("\"video_frame_size\" : \"1024x768\"");
    } else if (setting == "TYPE02") {
        m_settingFile.write("\"video_frame_type\" : \"TYPE02\",");
        m_settingFile.write("\n");
        m_settingFile.write("\"video_frame_size\" : \"640x480\"");
    } else if (setting == "TYPE03") {
        m_settingFile.write("\"video_frame_type\" : \"TYPE03\",");
        m_settingFile.write("\n");
        m_settingFile.write("\"video_frame_size\" : \"480x320\"");
    } else {
        qDebug() << "Error in saveSetting()" << endl;
    }

    m_settingFile.write("\n");
    m_settingFile.write("}");
    m_settingFile.close();

    return true;
}


bool CXmlManager::saveXML()
{
    if (!m_sharedDirListFile.open(QIODevice::WriteOnly))
        return false;

    if (m_localShareDirList.size() != m_localSymbolicDirList.size())
        return false;

    QXmlStreamWriter xmlWriter(&m_sharedDirListFile);

    xmlWriter.writeStartDocument();
    xmlWriter.writeStartElement("shareddir");

    for (int i = 0; i < m_localShareDirList.size(); i++) {
        xmlWriter.writeStartElement("contents");
        xmlWriter.writeStartElement("path");
        xmlWriter.writeCharacters(m_localShareDirList[i]);
        xmlWriter.writeEndElement();
        xmlWriter.writeStartElement("lnpath");
        xmlWriter.writeCharacters(m_localSymbolicDirList[i]);
        xmlWriter.writeEndElement();
        xmlWriter.writeEndElement();
    }

    if (m_dropboxShareMode) {
        xmlWriter.writeStartElement("dropbox");
        xmlWriter.writeStartElement("path");
        xmlWriter.writeCharacters(getObilinkDropboxInstalledPath());
        xmlWriter.writeEndElement();
        xmlWriter.writeStartElement("lnpath");
        xmlWriter.writeCharacters("dropbox");
        xmlWriter.writeEndElement();
        xmlWriter.writeEndElement();
    }

    xmlWriter.writeEndElement();
    xmlWriter.writeEndDocument();
    m_sharedDirListFile.close();

    return true;
}


bool CXmlManager::loadXML()
{
    // XML Query
    if( !m_sharedDirListFile.open(QFile::ReadOnly) ) {
        saveXML();
        return false;
    }

    // File 여닫지 말고 XML Query 재검색 방법 검색 / getXmlValue() 병합
    m_localShareDirList = getXmlValue("shareddir/contents/path/string()");
    m_localSymbolicDirList = getXmlValue("shareddir/contents/lnpath/string()");
    m_dropboxInstalledPathList = getXmlValue("shareddir/dropbox/path/string()");

    m_sharedDirListFile.close();
    return true;
}

QStringList CXmlManager::getXmlValue(QString xmlElement)
{
    m_sharedDirListFile.open(QFile::ReadOnly);

    QXmlQuery query;
    QStringList shareDirList;

    query.bindVariable("shareDir", &m_sharedDirListFile);
    query.setQuery(QString("doc($shareDir)/") + xmlElement);
    query.evaluateTo(&shareDirList);

    m_sharedDirListFile.close();

    return shareDirList;
}

QString CXmlManager::makeSymbolicPath(const QString originPath)
{
    QString symbolicRelativePath = originPath;
    symbolicRelativePath.remove(0, 3).replace("/", "_").replace(" ", "_");

    return makeSymbolicPath(originPath, symbolicRelativePath);
}

QString CXmlManager::makeSymbolicPath(QString originPath, const QString symbolicRelativePath)
{
    QDir dir;
    QString symbolicAbsolutePath = getSymbolicAbsoultePath(symbolicRelativePath);

    QString command = "\"" + dir.currentPath().replace("/", "\\") + "\\extbin\\ln.exe\""; /* ln.exe from http://www.flexhex.com for free */
    QString arg1 = "\"" + originPath.replace("/", "\\") + "\"";
    QString arg2 = "\"" + symbolicAbsolutePath + "\"";

    if (!QDir("\"" + dir.currentPath().replace("/", "\\") + "\\node\\public\"").exists()) {
        QDir().mkdir("node\\public");
        QDir().mkdir("node\\public\\contents");
    } else if (!QDir("\"" + dir.currentPath().replace("/", "\\") + "\\node\\public\\contents\"").exists()) {
        QDir().mkdir("node\\public\\contents");
    }

    QString qstr = command + " " + arg1 + " " + arg2;
    m_lnProc.start(command + " " + arg1 + " " + arg2);
    m_lnProc.waitForFinished();

    return symbolicRelativePath;
}

QString CXmlManager::getSymbolicAbsoultePath(const QString SymbolicRelativePath)
{
    QDir dir;
    return dir.currentPath().replace("/", "\\") + "\\node\\public\\contents\\" + SymbolicRelativePath;
}

bool CXmlManager::appendShareDir(QString originPath)
{
    if (originPath.length() <= 0
        || m_localShareDirList.contains(originPath))
        return false;

    m_localShareDirList.append(originPath);
    m_localSymbolicDirList.append(makeSymbolicPath(originPath));

    return true;
}

bool CXmlManager::removeShareDir(int row)
{
    if (row < 0 || row >= m_localShareDirList.size()) {
        return false;
    }

    QString symblicRelativePath = m_localSymbolicDirList[row];

    m_localShareDirList.removeAt(row);
    m_localSymbolicDirList.removeAt(row);

    removeDirectory(QDir::QDir("node/public/cache/video/contents/" + symblicRelativePath));

    return removeShareDir(symblicRelativePath);
}

bool CXmlManager::removeShareDir(QString symbolicRelativePath)
{

    QDir dir;
    QString command = "\"" + dir.currentPath().replace("/", "\\") + "\\extbin\\rj.exe\""; /* rj.exe from http://www.flexhex.com for free */
    QString symbolicAbsolutePath = getSymbolicAbsoultePath(symbolicRelativePath);

    m_rjProc.start(command + " \"" + symbolicAbsolutePath + "\"");

    if(m_rjProc.waitForFinished())
        dir.rmdir(symbolicAbsolutePath);

    return true;
}

void CXmlManager::updateDropbox(bool checked)
{
    if (checked)
        makeSymbolicPath(getObilinkDropboxInstalledPath(), "dropbox");
    else {
        removeShareDir("dropbox");
        m_dropboxInstalledPath.clear();
        m_dropboxInstalledPathList.clear();
    }

    m_dropboxShareMode = checked;
    CXmlManager::instance()->saveXML();
    return;
}

bool CXmlManager::isDropboxShareMode()
{
    // UPGRADE. need to upgrade logic & code
    QXmlQuery query;
    QString queryResult;

    m_sharedDirListFile.open(QFile::ReadOnly);

    query.bindVariable("shareDir", &m_sharedDirListFile);
    query.setQuery("doc($shareDir)/shareddir");
    query.evaluateTo(&queryResult);

    m_sharedDirListFile.close();

    if (queryResult.contains("dropbox"))
        return true;

    return false;
}

bool CXmlManager::isDropboxInstalled()
{
    m_dropboxInstalledPath.clear();
    QFileInfo symbolicFilePath = QDir::homePath() + "\\Links\\Dropbox.lnk";

    // 1st Step. Find path from dropbox link file
    if (QDir(symbolicFilePath.symLinkTarget()).exists() && symbolicFilePath.symLinkTarget().contains("Dropbox")) {
        setDropboxInstalledPath(symbolicFilePath.symLinkTarget());
        return true;
    }

    // 2nd Step. Find path from XML data
    if (m_dropboxInstalledPathList.size() > 0 && QDir(m_dropboxInstalledPathList[0]).exists() && m_dropboxInstalledPathList[0].contains("Dropbox")) {
        setDropboxInstalledPath(m_dropboxInstalledPathList[0]);
        return true;
    }
    return false;
}

QString CXmlManager::getDropboxInstalledPath()
{
    return m_dropboxInstalledPath;
}

bool CXmlManager::setDropboxInstalledPath (QString path)
{
    // Dropbox path must contain string of "Dropbox" and set root of dropbox path with filter.
    path = path.remove(path.lastIndexOf("Dropbox")+7, path.length());
    m_dropboxInstalledPath = path;
    return true;
}

QString CXmlManager::getObilinkDropboxInstalledPath()
{
    QString path = getDropboxInstalledPath();

    if (!QDir(path + "/Apps").exists())
        QDir().mkdir(path + "/Apps");

    if (!QDir(path + "/Apps/OBILINK").exists())
        QDir().mkdir(path + "/Apps/OBILINK");

    path = path + "/Apps/OBILINK";
    return path;
}

QStringList CXmlManager::getLocalShareDirList()
{
    return m_localShareDirList;
}

QStringList CXmlManager::getLocalSymbolicDirList()
{
    return m_localSymbolicDirList;
}

bool CXmlManager::removeAllSymbolDir()
{
    // Remove general symbolic share directory
    while (m_localSymbolicDirList.size() > 0) {
        removeShareDir(m_localSymbolicDirList[m_localSymbolicDirList.size()-1]);
        m_localSymbolicDirList.removeLast();
    }

    if (m_dropboxShareMode)
        removeShareDir("dropbox");

    return true;
}

void CXmlManager::updateShareSymbolicDir()
{
    for (int i = 0; i < m_localSymbolicDirList.size(); i++) {
        makeSymbolicPath(m_localShareDirList[i], m_localSymbolicDirList[i]);
    }
    return;
}

bool CXmlManager::removeDirectory(QDir dir)
{
    bool ok = dir.exists();
        if ( ok )
        {
            QFileInfoList entries = dir.entryInfoList( QDir::NoDotAndDotDot |
                    QDir::Dirs | QDir::Files );
            foreach ( QFileInfo entryInfo, entries )
            {
                QString path = entryInfo.absoluteFilePath();
                if ( entryInfo.isDir() )
                {
                    if ( ! removeDirectory( QDir( path ) ) )
                    {
                        ok = false;
                        break;
                    }
                }
                else
                {
                    QFile file( path );
                    if ( ! file.remove() )
                    {
                        ok = false;
                        break;
                    }
                }
            }
        }

        if ( ok && ! dir.rmdir( dir.absolutePath() ) )
            ok = false;

        return ok;
}
