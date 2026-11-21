mod config;
mod ui;
mod prompt;
mod runserver;



use std::sync::{Arc,Mutex};
use axum::extract::State;
use axum::routing::post;
use axum::{Router,routing::get};
use serde::{Deserialize,Serialize};
pub use tokio;

use crate::ui::mainui::{ehtml, index, indexcss, indexjs};
use crate::prompt::prompt::{Cprompt, Sprompt};
use crate::runserver::{win_run, win_runserver,};
pub use crate::config::prompt_config::{backup_prompt,clean_backup,init_config,read_prompt,writr_prompt,};
pub use crate::runserver::Childandport;



#[derive(Debug,Clone)]
pub struct Apistate{
    p1:Arc<Sprompt>,
    p2:Cprompt,
}
impl Default for Apistate {
    fn default() -> Self {
        let mut a = Sprompt::default();
        a.init();
        Apistate { p1: Arc::new(a),p2: Cprompt::default()}
    }
}
#[derive(Debug,Clone)]
pub struct Sdapi{
    pub sd:Arc<Mutex<Option<Childandport>>>,
}
impl Default for Sdapi {
    fn default() -> Self {
        Sdapi { sd:Arc::new(Mutex::new(None)) }
    }    
}







#[tokio::main]
async fn main() {
    println!("Hello");
    
    let list = tokio::net::TcpListener::bind("127.0.0.1:0").await.expect("Failed to bind to port");
    let state = Apistate::default();
    let mut sd = Sdapi::default();
    
    //win_backup_config().await;
    //win_clean_backup().await;

    println!("URL {}",list.local_addr().expect("what"));
    let _ = webbrowser::open(&format!("http://{}",list.local_addr().expect("what")));

    let apiserver:Router = axum::Router::new()
        .route("/included_prompt",get(prompt::included_prompt))
        .route("/prompt", get(prompt::prompt))
        .with_state(state);
    
    let sdapi:Router = Router::new()
        .route("/win_runserver",post(win_run))
        .with_state(sd);

    let assetsapi:Router = axum::Router::new()
        .route("/index.js", get(indexjs))
        .route("/index.css", get(indexcss));


    let server:Router<()> = axum::Router::new()
        .route("/", get(index))
        .nest("/assetsapi", assetsapi)
        .nest("/sdapi", sdapi)
        .nest("/api", apiserver)
        .route("/e", get(ehtml));
        //.fallback(mainui);

    axum::serve(list,server).await.expect("what")
}













#[derive(Debug,Clone,Deserialize,Serialize)]
pub enum Okanderr {
    Oka,
    Error
}
#[derive(Debug,Clone,Deserialize,Serialize)]
pub struct Res{
    state:Okanderr,
    text:String,
}
