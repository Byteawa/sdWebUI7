
mod ui;
mod prompt;

use axum::extract::State;
use axum::{Router,routing::get};
use tokio;

use crate::ui::mainui;
use crate::prompt::prompt::Aprompt;



#[derive(Debug,Clone,PartialEq, Eq)]
pub struct Apistate{
    p1:Aprompt,
}
impl Default for Apistate {
    fn default() -> Self {
        Apistate { p1: Aprompt::default() }
    }
}



#[tokio::main]
async fn main() {
    println!("Hello");
    
    let list = tokio::net::TcpListener::bind("127.0.0.1:0").await.expect("Failed to bind to port");
    let mut state = Apistate::default();
    state.p1.integrated();
    
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
