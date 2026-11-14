use axum::{self, response::Html};

pub async fn mainui()->Html<&'static str>{
    Html(include_str!("./../html/1.html"))
}