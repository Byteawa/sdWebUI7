use std::env;

use crate::prompt::prompt::Aprompt;







//备份
pub async fn win_backup_config(){


}


//初始化
pub async fn win_init_config(){
    

}


//写入
pub async fn win_writr_config(){
    let mut appdata = dirs::config_dir().expect("what");
    appdata.push("sdWebUI7");
    tokio::fs::create_dir_all(&appdata).await.expect("what");
    appdata.push("config.json");
    tokio::fs::write(appdata, "hi").await.expect("what");
}


//读取
pub async fn win_read_config(Aprompt:Aprompt){
    


}