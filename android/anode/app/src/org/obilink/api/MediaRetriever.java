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
    public abstract void close(int cursorHandle);
    public abstract int moveToFirst(int cursorHandle);
    public abstract int moveToNext(int cursorHandle);
    public abstract int getColumnIndex(int cursorHandle, String columnName);
    public abstract String getBitmapValue(int cursorHandle, int columnIndex);
    public abstract String getLongValue(int cursorHandle, int columnIndex);
    public abstract String getStringValue(int cursorHandle, int columnIndex);  
}
