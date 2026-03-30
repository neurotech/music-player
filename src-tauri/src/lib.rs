#![allow(unexpected_cfgs)]

mod discord;

#[tauri::command]
fn bring_to_front() {
    #[cfg(target_os = "macos")]
    {
        #[allow(deprecated)]
        use cocoa::appkit::NSApp;
        use objc::{msg_send, sel, sel_impl};
        #[allow(deprecated)]
        unsafe {
            let ns_app = NSApp();
            let _: () = msg_send![ns_app, activateIgnoringOtherApps: true];
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            discord::connect_discord,
            discord::update_discord_activity,
            discord::clear_discord_activity,
            discord::disconnect_discord,
            bring_to_front
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
