#[derive(FromValue)]
pub struct RsaOtherPrimesInfo {
    pub r: String,
    pub d: String,
    pub t: String,
}

#[derive(FromValue)]
pub struct JsonWebKey {
    pub kty: String,
    #[ion(name = "use")]
    pub r#use: Option<String>,
    pub key_ops: Option<Vec<String>>,
    pub alg: Option<String>,

    pub ext: Option<bool>,

    pub crv: Option<String>,
    pub x: Option<String>,
    pub y: Option<String>,
    pub d: Option<String>,
    pub n: Option<String>,
    pub e: Option<String>,
    pub p: Option<String>,
    pub q: Option<String>,
    pub dp: Option<String>,
    pub dq: Option<String>,
    pub qi: Option<String>,
    pub oth: Option<Vec<RsaOtherPrimesInfo>>,
    pub k: Option<String>,
}
