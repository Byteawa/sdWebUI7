use std::{path::PathBuf};
use uuid::{self, Uuid};
use axum::extract::path;

use crate::prompt::prompt::Cprompt;









//备份
pub async fn win_backup_config(){
    let mut appdata = dirs::config_dir().expect("what");
    appdata.push("sdWebUI7");
    tokio::fs::create_dir_all(&appdata).await.expect("what");
    appdata.push("config.json");
    let config = tokio::fs::read_to_string(&appdata).await.expect("what");
    let mut appdata = dirs::config_dir().expect("what");
    appdata.push("sdWebUI7");
    appdata.push("backup");
    tokio::fs::create_dir_all(&appdata).await.expect("what");
    let a = Uuid::now_v7().to_string()+".backup.json";
    appdata.push(&a);
    tokio::fs::write(appdata, config).await.expect("what");
    println!("{a}")
}


//初始化
pub async fn win_init_config(){
    

}


//写入
pub async fn win_writr_config(config:&Cprompt){
    let mut appdata = dirs::config_dir().expect("what");
    appdata.push("sdWebUI7");
    tokio::fs::create_dir_all(&appdata).await.expect("what");
    appdata.push("config.json");
    let config = serde_json::to_string(&config).expect("what");
    tokio::fs::write(appdata, config).await.expect("what");
    println!("write config");
}


//读取
pub async fn win_read_config()->Cprompt{
    let mut appdata = dirs::config_dir().expect("what");
    appdata.push("sdWebUI7");
    tokio::fs::create_dir_all(&appdata).await.expect("what");
    appdata.push("config.json");
    let config = tokio::fs::read_to_string(appdata).await.expect("what");
    let a:Cprompt = serde_json::from_str(&config).expect("what");
    println!("read config");
    a
}


//清除备份
pub async fn win_clean_backup(){
    let mut appdata = dirs::config_dir().expect("what");
    appdata.push("sdWebUI7");
    appdata.push("backup");
    let _ = tokio::fs::remove_dir_all(&appdata).await;   // 忽略不存在时的错误
    tokio::fs::create_dir_all(appdata).await.expect("what");
    println!("clean backup ok")
}