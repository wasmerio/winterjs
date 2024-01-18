use ion::conversions::FromValue;

#[derive(FromValue, ToValue)]
pub struct RsaOtherPrimesInfo {
    pub r: String,
    pub d: String,
    pub t: String,
}

#[derive(FromValue, ToValue, Default)]
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

impl<'cx> FromValue<'cx> for Box<JsonWebKey> {
    type Config = ();

    fn from_value(
        cx: &'cx ion::Context,
        value: &ion::Value,
        strict: bool,
        config: Self::Config,
    ) -> ion::Result<Self> {
        let jwk = JsonWebKey::from_value(cx, value, strict, config)?;
        Ok(Box::new(jwk))
    }
}
