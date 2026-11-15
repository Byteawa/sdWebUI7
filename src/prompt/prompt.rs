use std::{default, vec};

use axum::{Json, extract::State};
use serde::{Serialize,Deserialize};

use crate::{Apistate, prompt::prompt::{PromptKind::{Negative, Positive}, PromptSource::{Builtin, Custom}}};


#[derive(Debug,Clone,PartialEq, Eq,Serialize)]
pub struct Aprompt{
    pub p:Vec<PromptEntry>
}
// 消耗式：for e in a
impl IntoIterator for Aprompt {
    type Item = PromptEntry;
    type IntoIter = std::vec::IntoIter<PromptEntry>;

    fn into_iter(self) -> Self::IntoIter {
        self.p.into_iter()
    }
}
// 借用式：for e in &a
impl<'a> IntoIterator for &'a Aprompt {
    type Item = &'a PromptEntry;
    type IntoIter = std::slice::Iter<'a, PromptEntry>;

    fn into_iter(self) -> Self::IntoIter {
        self.p.iter()
    }
}
impl Default for Aprompt{
    fn default()->Aprompt{
        Aprompt { p: Vec::new() }
    }
}
/* 
impl Aprompt{
    pub fn init(&mut self){
        self.p.push(PromptEntry { source: Builtin, kind: Positive, name: "example".to_string(), content: "masterpiece, best quality, score_9, score_8, highres, absurdres, newest, year 2026, safe, extremely detailed, highly detailed".to_string() });
        self.p.push(PromptEntry { source: Builtin, kind: Negative, name: "example".to_string(), content: "worst quality, low quality, lowres, blurry, jpeg artifacts, watermark, signature, text, bad anatomy, bad hands, extra digits, missing fingers, malformed limbs".to_string() });
    }
}
 */

#[derive(Debug,Clone,PartialEq, Eq,Serialize,Deserialize)]
pub struct PromptEntry {
    source: PromptSource,     // 枚举：自定义 or 自带
    kind: PromptKind,         // 枚举：正向 or 负向
    name: String,             // 名称（如 "人像优化"）
    content: String,          // 实际提示词内容
}
#[derive(Debug,Clone,PartialEq, Eq,Serialize,Deserialize)]
pub enum PromptSource {
    Custom,     // 用户自定义
    Builtin,    // 系统内置
}
#[derive(Debug,Clone,PartialEq, Eq,Serialize,Deserialize)]
pub enum PromptKind {
    Positive,   // 正面提示词
    Negative,   // 负面提示词    
}

//========================================================================================================
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
    pub fn to_Apropmt(self)->Aprompt{
        let mut a = Aprompt::default();
        for i in self{
            a.p.push(PromptEntry { source: Builtin, kind: i.kind,name: i.name, content: i.content});
        }
        a
    }
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

impl Cprompt {
    pub fn to_Apropmt(self)->Aprompt{
        let mut a = Aprompt::default();
        for i in self{
            a.p.push(PromptEntry { source:Custom, kind: i.kind,name: i.name, content: i.content});
        }
        a
    }
}

//===========================================================================================================

#[axum::debug_handler]
pub async fn prompt(State(api): State<Apistate>)->Json<Aprompt>{
    let s = api.p1.to_Apropmt();
    let c = api.p2.to_Apropmt();
    let mut a:Aprompt = Aprompt::default();
    a.p.extend(s);
    a.p.extend(c); 
    Json(a)
}