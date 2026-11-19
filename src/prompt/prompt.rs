
use std::sync::Arc;
use axum::{Json, extract::State};
use serde::{Serialize,Deserialize};

use crate::{Apistate, prompt::prompt::{PromptKind::{Negative, Positive}}};



//========================================================================================================




#[derive(Debug,Clone,PartialEq, Eq,Serialize,Deserialize)]
pub enum PromptKind {
    Positive,   // 正面提示词
    Negative,   // 负面提示词    
}

#[derive(Debug,Clone,PartialEq, Eq,Serialize,Deserialize)]
pub struct SCpromptEntry {
    kind: PromptKind,         // 枚举：正向 or 负向
    name: String,             // 名称（如 "人像优化"）
    content: String,          // 实际提示词内容
}


#[derive(Debug,Clone,PartialEq, Eq,Serialize,Default,Deserialize)]
pub struct Sprompt{
    pub p:Vec<SCpromptEntry>,
}

impl IntoIterator for Sprompt {
    type Item = SCpromptEntry;
    type IntoIter = std::vec::IntoIter<SCpromptEntry>;
    fn into_iter(self) -> Self::IntoIter { self.p.into_iter() }
}

impl<'a> IntoIterator for &'a Sprompt {
    type Item = &'a SCpromptEntry;
    type IntoIter = std::slice::Iter<'a, SCpromptEntry>;
    fn into_iter(self) -> Self::IntoIter { self.p.iter() }
}

impl Sprompt {
    pub fn init(&mut self){
        self.p.push(SCpromptEntry {kind: Positive, name: "example".to_string(), content: "masterpiece, best quality, score_9, score_8, highres, absurdres, newest, year 2026, safe, extremely detailed, highly detailed".to_string() });
        self.p.push(SCpromptEntry {kind: Negative, name: "example".to_string(), content: "worst quality, low quality, lowres, blurry, jpeg artifacts, watermark, signature, text, bad anatomy, bad hands, extra digits, missing fingers, malformed limbs".to_string() });
    }
}

//=========================================================================================================================

#[derive(Debug,Clone,PartialEq, Eq,Serialize,Default,Deserialize)]
pub struct Cprompt{
    p:Vec<SCpromptEntry>,
}
impl IntoIterator for Cprompt {
    type Item = SCpromptEntry;
    type IntoIter = std::vec::IntoIter<SCpromptEntry>;
    fn into_iter(self) -> Self::IntoIter { self.p.into_iter() }
}

impl<'a> IntoIterator for &'a Cprompt {
    type Item = &'a SCpromptEntry;
    type IntoIter = std::slice::Iter<'a, SCpromptEntry>;
    fn into_iter(self) -> Self::IntoIter { self.p.iter() }
}


//===========================================================================================================

#[axum::debug_handler]
pub async fn included_prompt(State(Apistate): State<Apistate>)->Json<Arc<Sprompt>>{
    Json(Apistate.p1)
}

#[axum::debug_handler]
pub async fn prompt(State(Apistate): State<Apistate>)->Json<Cprompt>{
    Json(Apistate.p2)
}


