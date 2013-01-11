package com.koccalink.anode.module;

import java.io.ByteArrayOutputStream;

import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;

import org.meshpoint.anode.AndroidContext;

import android.content.ContentResolver;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Base64;
//import android.util.Log;

public class MediaRetriever extends MediaRetrieverBase implements IModule {
	final String TAG = "MediaRetriever";
	
	ContentResolver mContentResolver;
	Cursor mCursor;
	
	@Override
	public Object startModule(IModuleContext ctx) {
		// TODO Auto-generated method stub
		mContentResolver = ((AndroidContext)ctx).getAndroidContext().getContentResolver();
		return this;
	}

	@Override
	public void stopModule() {
		// TODO Auto-generated method stub

	}

	@Override
	public int prepare(String mediaType, String arg1) {
		// TODO Auto-generated method stub
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
		
		//TODO
		// Need to close mCursor?
		
		mCursor = mContentResolver.query(uri, null, selection, null, null);
		if (mCursor == null)
			return 0;
		
		return 1;
	}

	@Override
	public int moveToFirst() {
		// TODO Auto-generated method stub
		return mCursor.moveToFirst() ? 1: 0;
	}

	@Override
	public int moveToNext() {
		// TODO Auto-generated method stub
		return mCursor.moveToNext() ? 1 : 0;
	}

	@Override
	public int getColumnIndex(String columnName) {
		// TODO Auto-generated method stub
		return mCursor.getColumnIndex(columnName);
	}

	@Override
	public String getBitmapValue(int columnIndex) {
		// TODO Auto-generated method stub
		String path = mCursor.getString(columnIndex);
		
		Bitmap bm = BitmapFactory.decodeFile(path);
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		bm.compress(Bitmap.CompressFormat.JPEG, 100, baos);
		
		String encodedImage = Base64.encodeToString(baos.toByteArray(), Base64.DEFAULT);
		
		return encodedImage;
	}

	@Override
	public String getLongValue(int columnIndex) {
		// TODO Auto-generated method stub
		return Long.toString(mCursor.getLong(columnIndex));
	}

	@Override
	public String getStringValue(int columnIndex) {
		// TODO Auto-generated method stub
		return mCursor.getString(columnIndex);
	}

}
