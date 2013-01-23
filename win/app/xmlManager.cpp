#include "xmlManager.h"
#include "shareDir.h"
#include <QtXmlPatterns/QXmlQuery>
#include <QXmlStreamWriter>
#include <QXmlStreamReader>
#include <QXmlQuery>

/* File     : xmlManager.cpp
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 1.0.1
 * Date     : 2013-01-22
 */

CXmlManager* CXmlManager::m_instance = NULL;

CXmlManager::CXmlManager() :
    m_sharedDirListFile("./conf.xml")
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
    if (!m_sharedDirListFile.open(QIODevice::WriteOnly)) {
        // Implement if needed
        return false;
    }

    ShareDir sharedir;
    QXmlStreamWriter xmlWriter(&m_sharedDirListFile);

    xmlWriter.writeStartDocument();
    xmlWriter.writeStartElement("shareddir");

    for (int i = 0; i < sharedir.getLocalShareDirList().size(); i++) {
        xmlWriter.writeStartElement("contents");
        xmlWriter.writeStartElement("path");
        xmlWriter.writeCharacters(sharedir.getLocalShareDirList()[i]);
        xmlWriter.writeEndElement();
        xmlWriter.writeStartElement("lnpath");
        xmlWriter.writeCharacters(sharedir.getLocalShareDirlinkList()[i]);
        xmlWriter.writeEndElement();
        xmlWriter.writeEndElement();
    }


    if (sharedir.isSharedDropbox()) {
        xmlWriter.writeStartElement("dropbox");
        xmlWriter.writeStartElement("path");
        xmlWriter.writeCharacters(sharedir.getDropboxDir());
        xmlWriter.writeEndElement();
        xmlWriter.writeStartElement("lnpath");
        xmlWriter.writeCharacters(sharedir.getDropboxDirlink());
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

    ShareDir sharedir;

    sharedir.setLocalShareDirList(getXmlValue("shareddir/contents/path/string()"));
    sharedir.setLocalShareDirlinkList(getXmlValue("shareddir/contents/lnpath/string()"));
    sharedir.setSharedDropboxMode(checkDropboxMode());

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

bool CXmlManager::checkDropboxMode()
{
    m_sharedDirListFile.open(QFile::ReadOnly);

    QXmlQuery query;
    QString strtemp;

    query.bindVariable("shareDir", &m_sharedDirListFile);
    query.setQuery("doc($shareDir)/shareddir");
    query.evaluateTo(&strtemp);

    if (strtemp.contains("dropbox"))
        return true;

    return false;
}

