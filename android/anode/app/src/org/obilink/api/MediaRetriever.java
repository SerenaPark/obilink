package org.obilink.api;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class MediaRetriever extends Base {
    private static short classId = Env.getInterfaceId(MediaRetriever.class);
    
    protected MediaRetriever() {
        super(classId);     
    }
    
    //public abstract int prepare(String mediaType);
    public abstract int prepare(String mediaType, String arg1);
    public abstract int moveToFirst();
    public abstract int moveToNext();
    public abstract int getColumnIndex(String columnName);
    public abstract String getBitmapValue(int columnIndex);
    public abstract String getLongValue(int columnIndex);
    public abstract String getStringValue(int columnIndex);  
}
