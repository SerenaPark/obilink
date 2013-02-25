/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.platform;

public final class Org_obilink_api_MediaRetriever {

	private static Object[] __args = new Object[2];

	public static Object[] __getArgs() { return __args; }

	static Object __invoke(org.obilink.api.MediaRetriever inst, int opIdx, Object[] args) {
		Object result = null;
		switch(opIdx) {
		case 0: /* getBitmapValue */
			result = inst.getBitmapValue(
				(int)((org.meshpoint.anode.js.JSValue)args[0]).longValue
			);
			break;
		case 1: /* getColumnIndex */
			result = org.meshpoint.anode.js.JSValue.asJSNumber((long)inst.getColumnIndex(
				(String)args[0]
			));
			break;
		case 2: /* getLongValue */
			result = inst.getLongValue(
				(int)((org.meshpoint.anode.js.JSValue)args[0]).longValue
			);
			break;
		case 3: /* getStringValue */
			result = inst.getStringValue(
				(int)((org.meshpoint.anode.js.JSValue)args[0]).longValue
			);
			break;
		case 4: /* moveToFirst */
			result = org.meshpoint.anode.js.JSValue.asJSNumber((long)inst.moveToFirst());
			break;
		case 5: /* moveToNext */
			result = org.meshpoint.anode.js.JSValue.asJSNumber((long)inst.moveToNext());
			break;
		case 6: /* prepare */
			result = org.meshpoint.anode.js.JSValue.asJSNumber((long)inst.prepare(
				(String)args[0],
				(String)args[1]
			));
			break;
		default:
		}
		return result;
	}

}
