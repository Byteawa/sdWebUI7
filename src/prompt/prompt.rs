use std::vec;

use axum::{Json, extract::State};
use serde::Serialize;

use crate::{Apistate, prompt::prompt::{PromptKind::{Negative, Positive}, PromptSource::{Builtin, Custom}}};


#[derive(Debug,Clone,PartialEq, Eq,Serialize)]
pub struct Aprompt{
    pub p:Vec<PromptEntry>
}
impl Default for Aprompt{
    fn default()->Aprompt{
        Aprompt { p: Vec::new() }
    }
}
impl Aprompt{
    pub fn integrated(&mut self){
        self.p.push(PromptEntry { source: Builtin, kind: Positive, name: "example".to_string(), content: "masterpiece, best quality, score_9, score_8, highres, absurdres, newest, year 2026, safe, extremely detailed, highly detailed".to_string() });
        self.p.push(PromptEntry { source: Builtin, kind: Negative, name: "example".to_string(), content: "worst quality, low quality, lowres, blurry, jpeg artifacts, watermark, signature, text, bad anatomy, bad hands, extra digits, missing fingers, malformed limbs".to_string() });
    }
}


#[derive(Debug,Clone,PartialEq, Eq,Serialize)]
pub struct PromptEntry {
    source: PromptSource,     // 枚举：自定义 or 自带
    kind: PromptKind,         // 枚举：正向 or 负向
    name: String,             // 名称（如 "人像优化"）
    content: String,          // 实际提示词内容
}
#[derive(Debug,Clone,PartialEq, Eq,Serialize)]
pub enum PromptSource {
    Custom,     // 用户自定义
    Builtin,    // 系统内置
}
#[derive(Debug,Clone,PartialEq, Eq,Serialize)]
pub enum PromptKind {
    Positive,   // 正面提示词
    Negative,   // 负面提示词    
}
#[axum::debug_handler]
pub async fn prompt(State(api): State<Apistate>)->Json<Aprompt>{
    Json(api.p1)
}