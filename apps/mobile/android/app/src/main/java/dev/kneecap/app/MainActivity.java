package dev.kneecap.app;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // kneecap M3: local (non-npm) plugin registration. Must happen
        // before super.onCreate() — Capacitor Android docs' documented
        // pattern for app-local plugins (mirrors the auto-discovery iOS gets
        // for free via CAPBridgedPlugin's Objective-C runtime reflection).
        registerPlugin(NativeBridgePlugin.class);
        // kneecap M1 spike ONLY — see SpikeDiagnosticsPlugin.java's header.
        // Debug APKs only, so a release APK exposes no SpikeDiagnostics
        // bridge surface (iOS compiles the plugin out of Release instead).
        if (isDebuggable()) {
            registerPlugin(SpikeDiagnosticsPlugin.class);
        }
        super.onCreate(savedInstanceState);
    }

    /** `android:debuggable`, which AGP sets for the debug build type only.
     *  Used instead of BuildConfig.DEBUG because this module doesn't enable
     *  `buildFeatures.buildConfig` (off by default since AGP 8). */
    private boolean isDebuggable() {
        return (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // kneecap M1 spike — throwaway deep link (`kneecap-spike://open`)
        // that navigates the already-loaded WebView to spike.html, the
        // hidden diagnostics screen (docs/SPIKE-GUIDE.md has the exact
        // trigger commands). `launchMode="singleTask"` (AndroidManifest.xml,
        // pre-existing M3 setting) is what makes onNewIntent fire on the
        // already-running Activity instead of recreating it. Mirrors
        // SceneDelegate.swift's `navigateToSpikeHarness()` on iOS.
        //
        // Debug APKs only: the scheme's intent-filter lives in
        // src/debug/AndroidManifest.xml and release bundles no spike.html,
        // but check here too so no explicit intent can reach it in release.
        if (!isDebuggable()) {
            return;
        }
        Uri data = intent.getData();
        if (data != null && "kneecap-spike".equals(data.getScheme()) && getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() ->
                    getBridge().getWebView().evaluateJavascript("window.location.href = 'spike.html';", null)
            );
        }
    }
}
