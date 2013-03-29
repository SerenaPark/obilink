package org.meshpoint.anode;

import android.app.Activity;
import android.content.SharedPreferences;

import org.meshpoint.anode.Constants;


public class Config {
	public static final String TAG = "Config";

	//public static final String DEFAULT_APP_PATH = Constants.APP_DIR + "obilink/app-android.js"; 	
	public static final String DEFAULT_APP_PATH = "/storage/extSdCard/app-android.js"; 
	
	private static final String PORT = "8888";
	private static final String DEFAULT_APP_PATH_KEY = "app-path"; 
	
	private static SharedPreferences settings;
	
	public static void init(Activity action) {
		settings = action.getPreferences(Activity.MODE_PRIVATE);
	}
	
	public static void setDefaultAppPath(String appPath) {
		SharedPreferences.Editor ed = settings.edit();
		ed.putString(DEFAULT_APP_PATH_KEY, appPath);
		ed.commit();
	}
	
	public static String getDefaultAppPath() {
		return settings.getString(DEFAULT_APP_PATH_KEY, null);
	}

	public static String getPort() {
		return PORT;
	}
}
