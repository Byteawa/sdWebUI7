mod config;
mod ui;
mod prompt;
mod runserver;


use std::sync::Arc;
use axum::extract::State;
use axum::routing::post;
use axum::{Router,routing::get};
pub use tokio;

use crate::ui::mainui::{index,indexcss,indexjs};
use crate::prompt::prompt::{Cprompt, Sprompt};
use crate::runserver::{win_run, win_runserver};
pub use crate::config::prompt_config::{backup_prompt,clean_backup,init_config,read_prompt,writr_prompt,};


#[derive(Debug,Clone,PartialEq, Eq)]
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



#[tokio::main]
async fn main() {
    println!("Hello");
    
    let list = tokio::net::TcpListener::bind("127.0.0.1:0").await.expect("Failed to bind to port");
    let state = Apistate::default();
    
    
    //win_backup_config().await;
    //win_clean_backup().await;

    println!("URL {}",list.local_addr().expect("what"));
    let _ = webbrowser::open(&format!("http://{}",list.local_addr().expect("what")));

    let apiserver:Router = axum::Router::new()
        .route("/included_prompt",get(prompt::included_prompt))
        .route("/prompt", get(prompt::prompt))
        .route("/win_runserver",post(win_run))
        .with_state(state);


    let server:Router<()> = axum::Router::new()
        .route("/", get(index))
        .route("/index.js", get(indexjs))
        .route("/index.css", get(indexcss))
        .nest("/api", apiserver);

        //.fallback(mainui);

    axum::serve(list,server).await.expect("what")
}
