package com.Chetak

import android.app.Activity
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.media.Ringtone
import android.os.Build
import android.os.Vibrator
import android.content.Context

class RingtonePickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var pickerPromise: Promise? = null
    private val RINGTONE_PICKER_REQUEST = 999
    private var currentRingtone: Ringtone? = null
    private var isVibrating = false

    private val activityEventListener: ActivityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, intent: Intent?) {
            if (requestCode == RINGTONE_PICKER_REQUEST) {
                if (pickerPromise != null) {
                    if (resultCode == Activity.RESULT_OK) {
                        val uri: Uri? = intent?.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
                        if (uri != null) {
                            val ringtone = RingtoneManager.getRingtone(activity, uri)
                            val title = ringtone.getTitle(activity) ?: "Custom Tone"
                            
                            val map = com.facebook.react.bridge.Arguments.createMap()
                            map.putString("uri", uri.toString())
                            map.putString("name", title)
                            pickerPromise?.resolve(map)
                        } else {
                            pickerPromise?.reject("CANCELLED", "User cancelled ringtone picker")
                        }
                    } else {
                        pickerPromise?.reject("CANCELLED", "User cancelled ringtone picker")
                    }
                    pickerPromise = null
                }
            }
        }
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String {
        return "RingtonePicker"
    }

    @ReactMethod
    fun pickRingtone(promise: Promise) {
        val activity = getCurrentActivity()
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist")
            return
        }

        pickerPromise = promise

        try {
            val intent = Intent(RingtoneManager.ACTION_RINGTONE_PICKER)
            intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_NOTIFICATION or RingtoneManager.TYPE_ALARM)
            intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
            intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
            activity.startActivityForResult(intent, RINGTONE_PICKER_REQUEST)
        } catch (e: Exception) {
            pickerPromise?.reject("E_FAILED_TO_SHOW_PICKER", e)
            pickerPromise = null
        }
    }

    @ReactMethod
    fun startAlarmVibration() {
        try {
            val context = getCurrentActivity() ?: reactApplicationContext
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            if (vibrator.hasVibrator()) {
                val pattern = longArrayOf(0, 1000, 1000)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val audioAttr = android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                    vibrator.vibrate(android.os.VibrationEffect.createWaveform(pattern, 1), audioAttr)
                } else {
                    val audioAttr = android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(pattern, 1, audioAttr)
                }
                isVibrating = true
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun playRingtone(uriString: String, shouldVibrate: Boolean) {
        try {
            val uri = Uri.parse(uriString)
            currentRingtone?.stop()
            
            val activity = getCurrentActivity()
            val context = activity ?: reactApplicationContext
            
            currentRingtone = RingtoneManager.getRingtone(context, uri)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                currentRingtone?.isLooping = true
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                val audioAttr = android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
                currentRingtone?.audioAttributes = audioAttr
            }
            currentRingtone?.play()
            
            if (shouldVibrate) {
                startAlarmVibration()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun stopRingtone() {
        try {
            currentRingtone?.stop()
            currentRingtone = null
            
            if (isVibrating) {
                val context = getCurrentActivity() ?: reactApplicationContext
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                vibrator.cancel()
                isVibrating = false
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
