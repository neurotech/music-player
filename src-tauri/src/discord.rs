use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::Mutex;

static DISCORD_CLIENT: Mutex<Option<DiscordIpcClient>> = Mutex::new(None);

#[tauri::command]
pub fn connect_discord(client_id: String) -> Result<(), String> {
    let mut client_guard = DISCORD_CLIENT.lock().map_err(|e| e.to_string())?;

    if client_guard.is_some() {
        return Ok(());
    }

    let mut client = DiscordIpcClient::new(&client_id);
    client.connect().map_err(|e| e.to_string())?;

    *client_guard = Some(client);
    Ok(())
}

#[tauri::command]
pub fn update_discord_activity(
    title: String,
    artist: String,
    album: String,
) -> Result<(), String> {
    let mut client_guard = DISCORD_CLIENT.lock().map_err(|e| e.to_string())?;

    let client = client_guard.as_mut().ok_or("Discord not connected")?;

    let state = artist;
    let details_text = if album.is_empty() {
        title.clone()
    } else {
        format!("{}", title)
    };

    let payload = activity::Activity::new()
        .activity_type(activity::ActivityType::Listening)
        .status_display_type(activity::StatusDisplayType::State)
        .details(&details_text)
        .state(&state);

    client.set_activity(payload).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn clear_discord_activity() -> Result<(), String> {
    let mut client_guard = DISCORD_CLIENT.lock().map_err(|e| e.to_string())?;

    if let Some(client) = client_guard.as_mut() {
        client.clear_activity().map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn disconnect_discord() -> Result<(), String> {
    let mut client_guard = DISCORD_CLIENT.lock().map_err(|e| e.to_string())?;

    if let Some(mut client) = client_guard.take() {
        client.close().map_err(|e| e.to_string())?;
    }

    Ok(())
}
