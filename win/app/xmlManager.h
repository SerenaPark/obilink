#ifndef CXmlManager_H
#define CXmlManager_H

#include <QStringList>
#include <QFile>

/* File     : xmlManager.h
 * Author   : Edgar Seo
 * Company  : OBIGO KOREA
 * Version  : 1.0
 * Date     : 2013-01-15
 */

class CXmlManager
{
private:
    CXmlManager();
    ~CXmlManager();
    static CXmlManager* m_instance;
    QFile m_sharedDirListFile;                              // conf.xml

    QStringList getXmlValue(QString xmlPath);               // return list of value by the element
    bool checkDropboxMode();                                // return true, if dropbox is shared

public:
    static CXmlManager* instance();
    static void destroy();
    bool saveXML();                                         // save share directory info to conf.xml
    bool loadXML();                                         // load share directory info from conf.xml
};

#endif // CXmlManager_H
