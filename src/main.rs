mod config;
mod ui;
mod prompt;

use std::os::windows;
use axum::extract::State;
use axum::{Router,routing::get};
pub use tokio;

use crate::ui::mainui;
use crate::prompt::prompt::{Aprompt, Cprompt, Sprompt};



#[derive(Debug,Clone,PartialEq, Eq)]
pub struct Apistate{
    p1:Sprompt,
    p2:Cprompt,
}
impl Default for Apistate {
    fn default() -> Self {
        Apistate { p1: Sprompt::default(),p2: Cprompt::default()}
    }
}



#[tokio::main]
async fn main() {
    println!("Hello");
    //config::win_writr_config().await;
    let list = tokio::net::TcpListener::bind("127.0.0.1:0").await.expect("Failed to bind to port");
    let mut state = Apistate::default();
    state.p1.init();
    
    println!("know....{}",list.local_addr().expect("what"));
    webbrowser::open(&format!("http://{}",list.local_addr().expect("what")));

    let apiserver:Router = axum::Router::new()
        .route("/prompt",get(prompt::prompt))
        .with_state(state);


    let server:Router<()> = axum::Router::new()
        .route("/", get(mainui))
        .nest("/api", apiserver);

        //.fallback(mainui);

    axum::serve(list,server).await.expect("what")
}
