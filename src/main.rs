
mod ui;
use axum::{Router,routing::get};
use tokio;

use crate::ui::mainui;




#[tokio::main]
async fn main() {
    println!("Hello");
    
    let list = tokio::net::TcpListener::bind("127.0.0.1:0").await.expect("Failed to bind to port");
    
    
    println!("know....{}",list.local_addr().expect("what"));
    webbrowser::open(&format!("http://{}",list.local_addr().expect("what")));


    let server:Router<()> = axum::Router::new()
        .route("/", get(mainui));
        //.fallback(mainui);

    axum::serve(list,server).await.expect("what")
}
