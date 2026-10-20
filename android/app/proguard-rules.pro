# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Preserve debugging stack traces
-keepattributes SourceFile,LineNumberTable
-keepattributes Exceptions,InnerClasses,Signature,Deprecated,EnclosingMethod

# Capacitor Core & Bridge
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.BridgeActivity { *; }
-keep class * extends com.getcapacitor.BridgeFragment { *; }
-keep class * extends com.getcapacitor.Bridge { *; }

# Preserve JavaScript Interface methods accessed from WebView
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve WebKit WebView clients
-keepclassmembers class * extends android.webkit.WebViewClient { *; }
-keepclassmembers class * extends android.webkit.WebChromeClient { *; }

# Preserve Cordova plugin compatibility
-keep class org.apache.cordova.** { *; }
-keep interface org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**
-dontwarn com.getcapacitor.**

# Project MainActivity
-keep class com.lifeencoder.chatbox.MainActivity { *; }
