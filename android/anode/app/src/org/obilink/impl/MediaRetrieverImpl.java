package org.obilink.impl;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;

import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.AndroidContext;

import org.obilink.api.MediaRetriever;

import android.content.ContentResolver;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Base64;
//import android.util.Log;

public class MediaRetrieverImpl extends MediaRetriever implements IModule {
	final String TAG = "MediaRetrieverImpl";
	
	ContentResolver mContentResolver;
	HashMap<Integer, Cursor> mCursorMap = new HashMap<Integer, Cursor>();
	
	@Override
	public Object startModule(IModuleContext ctx) {
		mContentResolver = ((AndroidContext)ctx).getAndroidContext().getContentResolver();
		return this;
	}

	@Override
	public void stopModule() {
	}

	@Override
	public int prepare(String mediaType, String arg1) {
		Uri uri;
		String selection;

		if (mediaType.equals("audio")) {
			uri = android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
			selection = MediaStore.Audio.Media.IS_MUSIC + " = 1";
		} else if (mediaType.equals("album")) {
				uri = android.provider.MediaStore.Audio.Albums.EXTERNAL_CONTENT_URI;
				selection = MediaStore.Audio.Albums._ID + " = " + arg1;
		} else {
			return 0;
		}
		
		Cursor c = mContentResolver.query(uri, null, selection, null, null);
		if (c == null)
			return 0;
		
		int cursorHandle = c.hashCode();
		mCursorMap.put(cursorHandle, c);
		
		return cursorHandle;
	}

	@Override
	public void close(int cursorHandle) {
		Cursor c = mCursorMap.get(cursorHandle);
		if (c != null) {
			mCursorMap.remove(c.hashCode());
			c.close();
		}
	}
	
	@Override
	public int moveToFirst(int cursorHandle) {
		Cursor c = mCursorMap.get(cursorHandle);
		return c.moveToFirst() ? 1: 0;
	}

	@Override
	public int moveToNext(int cursorHandle) {
		Cursor c = mCursorMap.get(cursorHandle);
		return c.moveToNext() ? 1 : 0;
	}

	@Override
	public int getColumnIndex(int cursorHandle, String columnName) {
		Cursor c = mCursorMap.get(cursorHandle);
		return c.getColumnIndex(columnName);
	}

	@Override
	public String getBitmapValue(int cursorHandle, int columnIndex) {
		Cursor c = mCursorMap.get(cursorHandle);
		String path = c.getString(columnIndex);
		
		Bitmap bm = BitmapFactory.decodeFile(path);
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		bm.compress(Bitmap.CompressFormat.JPEG, 100, baos);
		
		String encodedImage = Base64.encodeToString(baos.toByteArray(), Base64.DEFAULT);
		
		return encodedImage;
	}

	@Override
	public String getLongValue(int cursorHandle, int columnIndex) {
		Cursor c = mCursorMap.get(cursorHandle);
		return Long.toString(c.getLong(columnIndex));
	}

	@Override
	public String getStringValue(int cursorHandle, int columnIndex) {
		Cursor c = mCursorMap.get(cursorHandle);
		return c.getString(columnIndex);
	}

}
