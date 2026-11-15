use std::process::Command;
pub fn run(dit:&str,clip:&str,vae:&str,lorapath:&str,post:&str){
        let status = Command::new("sd-server.exe")
        .args([
            "--diffusion-model",
            &dit,
            "--llm",
            &clip,
            "--vae",
            &vae,
            "--listen-ip",
            "127.0.0.1",
            "--listen-port",
            &post,
            "--vae-tiling",
            "--lora-model-dir",
            &lorapath,
        ])
        .status()
        .expect("what");

}