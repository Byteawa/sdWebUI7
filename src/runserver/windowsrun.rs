use std::panic::resume_unwind;
//use std::process::Child;
use std::{io, sync::{Mutex,Arc}, time::Duration};

use std::ffi::OsStr;
use std::path::Path;
use axum::Json;
use axum::extract::State;
use axum::response::IntoResponse;
use tokio::process::Child;
use std::result::Result::Ok;
use crate::Okanderr::{Error, Oka};
use crate::{Apistate, Sdapi, Okanderr, Res};




pub async fn win_runserver(dit: &str,clip: &str,vae: &str,lorapath: &str,) -> Result<Childandport, io::Error> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let port = listener.local_addr()?.port();
    drop(listener); // 释放端口，让 sd-server 能绑上

    let mut child = tokio::process::Command::new("sd-server.exe")
        .args([
            "--diffusion-model", &dit,
            "--llm", &clip,
            "--vae", &vae,
            "--listen-ip", "127.0.0.1",
            "--listen-port", &port.to_string(),
            "--vae-tiling",
            "--lora-model-dir", &lorapath,
        ])
        .spawn()?;

    // 等一小会儿让进程起来
    tokio::time::sleep(Duration::from_millis(2000)).await;

    // 检查一下有没有立即崩
    if let Ok(Some(code)) = child.try_wait() {
        eprintln!("sd-server.exe exited immediately with code {:?}", code);
    }

    Ok(Childandport { child:child, port:port })
}

#[axum::debug_handler]
pub async fn win_run(State(api):State<Sdapi>,Json(Sd):Json<Sd>)->Json<Res>{
    if path_exists(&Sd.dit).await && path_exists(&Sd.clip).await && path_exists(&Sd.vae).await && path_exists(&Sd.lorapath).await{
    //是否运行
    let is_running = {
        let a = api.sd.lock().expect("what");
        a.is_some()
    };
    if is_running {
        return Json(Res{state:Error,text:"is runing....??/它是不是已经启动了".to_string()});
    }
    else {
        if let Ok(o) = win_runserver(&Sd.dit, &Sd.clip, &Sd.vae, &Sd.lorapath).await{
            return Json(Res{state:Oka,text:o.port.to_string()});
        }else {
            return Json(Res{state:Error,text:"what/理论上不会发生".to_string()});
        }
    }
    }else {
        return Json(Res{state:Error,text:"what????/理论上不会发生".to_string()});
    }
    
}




#[derive(Debug)]
pub struct Childandport{
    pub child:Child,
    pub port:u16,
}

#[derive(Debug,Clone,PartialEq, Eq,serde::Serialize,serde::Deserialize)]
pub struct Sd{
    pub dit:String,
    pub clip:String,
    pub vae:String,
    pub lorapath:String
}






/// 异步判断路径是否存在（文件或目录）
///
/// - 输入：`String`
/// - 路径不合法、无权限、不存在，均视为不存在
pub async fn path_exists(path: &str) -> bool {
    let p = Path::new(&path);

    // 1. 先做基础路径合法性检查
    if p.as_os_str().is_empty() {
        return false;
    }

    // 2. 异步查询元数据
    match tokio::fs::metadata(p).await {
        Ok(_) => true,
        Err(e) => {
            use std::io::ErrorKind;
            match e.kind() {
                ErrorKind::NotFound => {println!("NotFound{:?}",p);false},
                ErrorKind::PermissionDenied => {println!("PermissionDenied{:?}",p);false},
                _ => {println!("what???");false},
            }
        }
    }
}




/// 异步获取指定文件夹下所有具有给定后缀的文件
///
/// - `dir`: 文件夹路径（String）
/// - `ext`: 文件后缀，例如 `"rs"`、`"txt"`（不带点）
/// - 返回：匹配文件的**完整路径**列表（Vec<String>）
pub async fn list_files_with_ext(dir: String, ext: String) -> Vec<String> {
    let p = Path::new(&dir);

    // 路径不合法
    if p.as_os_str().is_empty() {
        return Vec::new();
    }

    // 读取目录
    let mut read_dir = match tokio::fs::read_dir(p).await {
        Ok(rd) => rd,
        Err(_) => return Vec::new(), // 不存在 / 无权限 / 其他错误
    };

    let mut result = Vec::new();

    // 遍历目录项
    while let Ok(Some(entry)) = read_dir.next_entry().await {
        let path = entry.path();

        // 只处理文件
        if let Ok(meta) = entry.metadata().await {
            if !meta.is_file() {
                continue;
            }
        } else {
            continue;
        }



    // 检查后缀
    if let Some(file_ext) = path.extension() {
        if file_ext == OsStr::new(&ext) {
            if let Some(path_str) = path.to_str() {
                result.push(path_str.to_string());
                }
            }
        }
    }

    result
}