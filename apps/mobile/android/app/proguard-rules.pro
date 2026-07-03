# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# expo-av missing class workaround for R8
-dontwarn expo.modules.core.interfaces.services.KeepAwakeManager

# Firebase Cloud Messaging (FCM) — keep so getDevicePushTokenAsync() works in
# minified release builds. Without these, R8 obfuscated the FCM/GMS classes that
# Firebase reaches via reflection and the device push token came back NULL.
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Expo native modules bridge — keep so expo-notifications can reach its native impl.
-keep class expo.modules.** { *; }

# @react-native-google-signin — ships no consumer proguard rules, so R8 would
# obfuscate its native module + GMS auth result classes and break sign-in.
-keep class com.reactnativegooglesignin.** { *; }
-keep class com.google.android.gms.auth.api.signin.** { *; }
-dontwarn com.reactnativegooglesignin.**
