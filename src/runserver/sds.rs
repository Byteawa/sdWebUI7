
use axum::{Json, extract::State};

use crate::{Okanderr::{Error, Oka}, Res, Sdapi, runserver::windowsrun::Sd};



pub async fn isrun(State(Sdapi):State<Sdapi>) -> Json<Res>{
    let mut sd = Sdapi.sd.lock().expect("what/这不该发生");
    match &mut *sd{
        None => {Json(Res { state: Oka, text: "not run/没在运行".to_string() })}
        Some(s)=>{
            match s.child.try_wait(){
                Ok(o) => {
                    match o {
                        Some(s) => {Json(Res { state: Error, text: format!("is exit/已经退出：{:?}",s)})}
                        None => {Json(Res { state: Oka, text: "isrun/正在运行".to_string() })}
                     //_ => {Json(Res { state: Error, text: "what/理论上不会出现".to_string() })}
                    }
                }
                Err(e) => {Json(Res { state: Error, text: format!("Err/错误：{}",e)})}
                //_ => {Json(Res { state: Error, text: "what/理论上不会出现".to_string() })}
            }
        }
        //_=>{Json(Res { state: Error, text: "what/理论上不会出现".to_string() })}
    }
}
pub async fn whatport(State(Sdapi): State<Sdapi>) -> Json<Res> {
    let mut sd = Sdapi.sd.lock().unwrap();

    let port = match &mut *sd {
        Some(o) => match o.child.try_wait() {
            Ok(None) => o.port,
            _ => {
                return Json(Res {
                    state: Error,
                    text: "no".to_string(),
                });
            }
        },
        None => {
            return Json(Res {
                state: Error,
                text: "no".to_string(),
            });
        }
    };

    Json(Res {
        state: Oka,
        text: port.to_string(),
    })
}