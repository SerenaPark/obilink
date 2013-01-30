#include "xmlManager.h"
#include <QtXmlPatterns/QXmlQuery>
#include <QXmlStreamWriter>
#include <QXmlStreamReader>
#include <QXmlQuery>

#include <QDir>
#include <QDebug>
#include <Windows.h>

/* File     : xmlManager.cpp
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 2.0.2
 * Date     : 2013-01-30
 */

CXmlManager* CXmlManager::m_instance = NULL;

CXmlManager::CXmlManager() :
    m_sharedDirListFile("./conf.xml"),
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

QString CXmlManager::getDropboxInstalledPath()
{
    // FIXME. Exception when dropbox has not been installed
    QDir dir;
    QFileInfo SymbolicPath = dir.homePath().replace("/", "\\") + "\\Links\\Dropbox.lnk";

    return SymbolicPath.symLinkTarget();
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
        xmlWriter.writeCharacters(getDropboxInstalledPath());
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

bool CXmlManager::isDropboxShareMode()
{
    // FIXME. 쿼리문이 정상적인지 외부 프로그램을 통해 확인
    // FIXME. 드랍박스가 있는지 판단하는 더 좋은 코드 확인
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

    QString command = "\"" + dir.currentPath().replace("/", "\\") + "\\extbin\\ln.exe\"";
    QString arg1 = "\"" + originPath.replace("/", "\\") + "\"";
    QString arg2 = "\"" + symbolicAbsolutePath + "\"";  //C:\TEST\node\public\content\sample

    if (!QDir("\"" + dir.currentPath().replace("/", "\\") + "\\node\\public\"").exists()) {
        QDir().mkdir("node\\public");
        QDir().mkdir("node\\public\\contents");
    } else if (!QDir("\"" + dir.currentPath().replace("/", "\\") + "\\node\\public\\contents\"").exists()) {
        QDir().mkdir("node\\public\\contents");
    }

    m_lnProc.start(command + " " + arg1 + " " + arg2);

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

    return removeShareDir(symblicRelativePath);
}

bool CXmlManager::removeShareDir(QString SymbolicRelativePath)
{
    QString symbolicAbsolutePath = getSymbolicAbsoultePath(SymbolicRelativePath);
    return DeleteJunctionPoint((char*)symbolicAbsolutePath.toStdString().c_str());
}

void CXmlManager::updateDropbox(bool checked)
{
    // FIXME. add exception for case of dropbox has not been installed
    if (checked)
        makeSymbolicPath(getDropboxInstalledPath(), "dropbox");
    else
        removeShareDir("dropbox");

    m_dropboxShareMode = checked;

    CXmlManager::instance()->saveXML();
    return;
}

QStringList CXmlManager::getLocalShareDirList()
{
    return m_localShareDirList;
}

QStringList CXmlManager::getLocalSymbolicDirList()
{
    return m_localSymbolicDirList;
}

bool CXmlManager::DeleteJunctionPoint(char* path)
{
    REPARSE_GUID_DATA_BUFFER reparsePoint = {'\0'};
    reparsePoint.ReparseTag = IO_REPARSE_TAG_MOUNT_POINT;

    HANDLE hFile = CreateFileA(path, GENERIC_WRITE, 0, NULL, OPEN_EXISTING, FILE_FLAG_OPEN_REPARSE_POINT | FILE_FLAG_BACKUP_SEMANTICS, NULL);
    if (!hFile)
        return false;

    DWORD returnedBytes;
    DWORD result = DeviceIoControl(hFile, FSCTL_DELETE_REPARSE_POINT, &reparsePoint, REPARSE_GUID_DATA_BUFFER_HEADER_SIZE, NULL, 0, &returnedBytes, NULL) != 0;

    if (result == 0) {
        qDebug() << "Failed to issue FSCTL_DELETE_REPARSE_POINT. Last error: 0x" << GetLastError();
        return false;
    }
    CloseHandle(hFile);

    QDir dir;
    return dir.rmdir(path);
}
