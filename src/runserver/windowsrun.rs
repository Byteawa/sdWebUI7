use std::panic::resume_unwind;
//use std::process::Child;
use std::{io, sync::Mutex, time::Duration};
use std::sync::Arc;
use axum::extract::State;
use axum::response::IntoResponse;
use tokio::process::Child;


use crate::Apistate;




pub async fn win_runserver(dit: &str,clip: &str,vae: &str,lorapath: &str,post: &str,) -> Result<Childandport, io::Error> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let port = listener.local_addr()?.port();
    drop(listener); // 释放端口，让 sd-server 能绑上

    let mut child = tokio::process::Command::new("sd-server.exe")
        .args([
            "--diffusion-model", dit,
            "--llm", clip,
            "--vae", vae,
            "--listen-ip", "127.0.0.1",
            "--listen-port", &port.to_string(),
            "--vae-tiling",
            "--lora-model-dir", lorapath,
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

pub async fn win_run(State(Apistate):State<Apistate>)->impl IntoResponse{
    let a = Apistate.sdserver.lock().expect("what");
    if let Some(a) = a.as_ref() {
        return "";
    }else {
        return "";
    }
}




#[derive(Debug)]
pub struct Childandport{
    pub child:Child,
    pub port:u16,
}