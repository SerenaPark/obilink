#include "xmlManager.h"
#include <QtXmlPatterns/QXmlQuery>
#include <QXmlStreamWriter>
#include <QXmlStreamReader>
#include <QXmlQuery>
#include <QMessageBox>

#include <QDir>
#include <QDebug>
#include <Windows.h>

/* File     : xmlManager.cpp
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 2.0.4
 * Date     : 2013-02-08
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
        makeSymbolicPath(getDropboxInstalledPath(), "dropbox");
    else
        removeShareDir("dropbox");

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
    return QDir(getDropboxInstalledPath()).exists();
}

QString CXmlManager::getDropboxInstalledPath()
{
    QDir dir;
    QFileInfo SymbolicPath = dir.homePath().replace("/", "\\") + "\\Links\\Dropbox.lnk";
    QString installedDropboxPath = SymbolicPath.symLinkTarget() + "\\Apps\\OBILINK";

    if (!QDir(SymbolicPath.symLinkTarget() + "\\Apps").exists()) {
        QDir().mkdir(SymbolicPath.symLinkTarget() + "\\Apps");
        QDir().mkdir(SymbolicPath.symLinkTarget() + "\\Apps\\OBILINK");
    } else if (!QDir(SymbolicPath.symLinkTarget() + "\\Apps\\OBILINK").exists()) {
        QDir().mkdir(SymbolicPath.symLinkTarget() + "\\Apps\\OBILINK");
    }

    return installedDropboxPath;
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
    QProcess removeAllSymbolicDirProc;
    QDir dir;
    QString command = "\"" + dir.currentPath().replace("/", "\\") + "\\extbin\\rj.exe\""; /* rj.exe from http://www.flexhex.com for free */

    while (m_localSymbolicDirList.size() > 0) {
        QString symbolicAbsolutePath = getSymbolicAbsoultePath(m_localSymbolicDirList[m_localSymbolicDirList.size()-1]);
        removeAllSymbolicDirProc.start(command + " \"" + symbolicAbsolutePath + "\"");

        if(removeAllSymbolicDirProc.waitForFinished())
            dir.rmdir(symbolicAbsolutePath);

        m_localSymbolicDirList.removeLast();
    }
    return true;

}

void CXmlManager::updateShareSymbolicDir()
{
    for (int i = 0; i < m_localSymbolicDirList.size(); i++) {
        makeSymbolicPath(m_localShareDirList[i], m_localSymbolicDirList[i]);
    }
    return;
}
