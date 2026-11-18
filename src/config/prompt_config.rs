use std::{path::PathBuf};
use uuid::{self, Uuid};
use axum::extract::path;

use crate::prompt::prompt::Cprompt;





//路径
pub async fn path_config()->PathBuf{
    let mut appdata = dirs::config_dir().expect("what");
    appdata.push("sdWebUI7");
    tokio::fs::create_dir_all(&appdata).await.expect("what");
    appdata
}




//备份
pub async fn backup_prompt(){
    let mut appdata = path_config().await;
    appdata.push("prompt.json");
    let config = tokio::fs::read_to_string(&appdata).await.expect("what");
    let mut appdata = path_config().await;
    appdata.push("backup");
    tokio::fs::create_dir_all(&appdata).await.expect("what");
    let a = Uuid::now_v7().to_string()+".backup.json";
    appdata.push(&a);
    tokio::fs::write(appdata, config).await.expect("what");
    println!("{a}")
}


//初始化
pub async fn init_config(){
    

}


//写入
pub async fn writr_prompt(config:&Cprompt){
    let mut appdata = path_config().await;
    appdata.push("prompt.json");
    let config = serde_json::to_string(&config).expect("what");
    tokio::fs::write(appdata, config).await.expect("what");
    println!("write config");
}


//读取
pub async fn read_prompt()->Cprompt{
    let mut appdata = path_config().await;
    appdata.push("prompt.json");
    let config = tokio::fs::read_to_string(appdata).await.expect("what");
    let a:Cprompt = serde_json::from_str(&config).expect("what");
    println!("read config");
    a
}


//清除备份
pub async fn clean_backup(){
    let mut appdata = path_config().await;
    appdata.push("backup");
    let _ = tokio::fs::remove_dir_all(&appdata).await;   // 忽略不存在时的错误
    tokio::fs::create_dir_all(appdata).await.expect("what");
    println!("clean backup ok")
}