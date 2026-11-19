use axum::{self, response::{Html, IntoResponse},http::header};

pub async fn index()->Html<&'static str>{
    Html(include_str!("./mainui/index.html"))
}

pub async fn indexjs() -> impl IntoResponse {
    // 用括号把 (响应头, 响应体) 包起来
    (
        [(header::CONTENT_TYPE, "application/javascript")],
        include_str!("./mainui/index.js")
    )
}
pub async fn indexcss() -> impl IntoResponse {
    // 用括号把 (响应头, 响应体) 包起来
    (
        [(header::CONTENT_TYPE, "text/css")],
        include_str!("./mainui/index.css")
    )
}