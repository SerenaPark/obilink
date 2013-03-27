package org.obilink.impl;


import java.io.OutputStream;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.PriorityQueue;

import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.AndroidContext;

import org.obilink.api.MediaRetriever;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.ThumbnailUtils;
import android.net.Uri;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Message;
import android.os.Process;
import android.os.ParcelFileDescriptor;
import android.util.Base64;
import android.util.Log;

import android.media.MediaMetadataRetriever;
import android.content.ContentValues;
import android.provider.MediaStore.Images;
import android.provider.MediaStore.Audio;
import android.provider.MediaStore.Video;



public class MediaRetrieverImpl extends MediaRetriever implements IModule {
    private Handler mThumbHandler; 	
    private static final int IMAGE_THUMB = 1;
    private static final String TAG = "MediaRetrieverImpl";    
    private PriorityQueue<VideoThumbRequest> mVideoThumbQueue;
    
	ContentResolver mContentResolver;
	HashMap<Integer, Cursor> mCursorMap = new HashMap<Integer, Cursor>();
	
	@Override
	public Object startModule(IModuleContext ctx) {
		mContentResolver = ((AndroidContext)ctx).getAndroidContext().getContentResolver();		 
		
		mVideoThumbQueue = new PriorityQueue<VideoThumbRequest>(); 
		mVideoThumbQueue.clear();
		HandlerThread ht = new HandlerThread("video thumb thread", Process.THREAD_PRIORITY_BACKGROUND);
		ht.start();
		mThumbHandler = new Handler(ht.getLooper()) {
		    @Override
		    public void handleMessage(Message msg) {
		        if (msg.what == IMAGE_THUMB) {
		            synchronized (mVideoThumbQueue) {
		            	VideoThumbRequest req = mVideoThumbQueue.poll();
		            	req.makeThumb();
		            }
		        }
		    }
		};

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
			uri = Audio.Media.EXTERNAL_CONTENT_URI;
			selection = Audio.Media.IS_MUSIC + " = 1";			
		} else if (mediaType.equals("album")) {
			uri = Audio.Albums.EXTERNAL_CONTENT_URI;
			selection = Audio.Albums._ID + " = " + arg1;
		} else if (mediaType.equals("video")) {			
			uri = Video.Media.EXTERNAL_CONTENT_URI;						
			selection = null;
			this.checkHasThumb(uri);
		} else if (mediaType.equals("video.thumbnails")) {		

			uri = Video.Thumbnails.EXTERNAL_CONTENT_URI;
			//selection = MediaStore.Video.Thumbnails.VIDEO_ID + " = " + arg1 + " and " + MediaStore.Video.Thumbnails.KIND + " = " + MediaStore.Video.Thumbnails.MICRO_KIND ;
			selection = Video.Thumbnails.VIDEO_ID + " = " + arg1;				

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

	@Override
	public String createVideoThumbnail(String filePath) {
		String encodedImage = "";
		
		Bitmap bm = ThumbnailUtils.createVideoThumbnail(filePath, Video.Thumbnails.MINI_KIND);
		if (bm != null) {
			int bmSize = bm.getHeight() * bm.getRowBytes();
			ByteBuffer bbuf = ByteBuffer.allocate(bmSize);
			bm.copyPixelsToBuffer(bbuf);
			encodedImage = Base64.encodeToString(bbuf.array(), Base64.DEFAULT);
		}
		
		return encodedImage;		
	}

	/*Checks if the thumbnails of the specified image(id) has been created */
	private void checkHasThumb(Uri uri) {
		String[] proj = {  
		  Video.VideoColumns._ID,  
		  Video.VideoColumns.DATA,  
		};  
  
		long videoId = 0;  
		String videoPath = "";  
		
		Cursor thumbCur = mContentResolver.query(uri, proj,
												 null, null, null);  
		try { 														 
			if (thumbCur != null && thumbCur.moveToFirst()){  
				do {
					int id = thumbCur.getColumnIndex(Video.VideoColumns._ID);  
					int pathId = thumbCur.getColumnIndex(Video.VideoColumns.DATA);  
					 
					videoId   = thumbCur.getLong( id );  
					videoPath = thumbCur.getString( pathId );  
										
					Bitmap bmThumb = Video.Thumbnails.getThumbnail(mContentResolver, videoId, 
															Video.Thumbnails.MINI_KIND, null);
					
					if (bmThumb == null) {													            
			            try {
			            	VideoThumbRequest req = new VideoThumbRequest(mContentResolver, videoId, videoPath);					                
			                mVideoThumbQueue.add(req);
			                // Trigger the handler.
			                mThumbHandler.obtainMessage(IMAGE_THUMB).sendToTarget();
			            } catch (Throwable t) {
			                Log.w(TAG, t);
			            }				        											                            
					}					 
				}while (thumbCur.moveToNext());			  
			}  
		} finally { 
            if (thumbCur != null ) thumbCur.close();  
        }  					
	}
	
	
	private static class VideoThumbRequest {
		private ContentResolver mCr;
        private long mVideoId = 0;
        private String mVideoPath = "";         

        public VideoThumbRequest(ContentResolver cr, long id, String path) { 
        	mCr			= cr;
        	mVideoId 	= id;
        	mVideoPath 	= path;
        }

        public void makeThumb() {
			Uri    thumbUri = Video.Thumbnails.EXTERNAL_CONTENT_URI;
			
			Bitmap bm = ThumbnailUtils.createVideoThumbnail(mVideoPath, Video.Thumbnails.MINI_KIND );
			if (bm != null ) {
				ContentValues values = new ContentValues(4);
				 
				values.put(Video.Thumbnails.KIND, Video.Thumbnails.MINI_KIND);
				values.put(Video.Thumbnails.VIDEO_ID, mVideoId);
				values.put(Video.Thumbnails.WIDTH, bm.getWidth());
				values.put(Video.Thumbnails.HEIGHT, bm.getHeight());
				try {                                  
				    Uri insUri = mCr.insert(thumbUri, values);
				    if (insUri != null) {
				        OutputStream thumbOut = mCr.openOutputStream(insUri);
				        bm.compress(Bitmap.CompressFormat.JPEG, 85, thumbOut);
				        thumbOut.close();
				    }                                  
				} catch (Exception ex) {
				    Log.w(TAG, ex);
				}                                
			} 
        }
        
    }	
}
