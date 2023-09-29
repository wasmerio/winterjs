use std::collections::HashMap;

use bytes::Bytes;
use ion::{conversions::FromValue, flags::IteratorFlags, Context, OwnedKey, Value};
use mozjs::conversions::ConversionBehavior;

#[derive(FromValue)]
pub(super) struct Response {
    #[ion(convert = ConversionBehavior::EnforceRange)]
    pub(super) status: Option<u16>,

    #[ion(parser = |v| parse_headers(cx, v))]
    pub(super) headers: Option<HashMap<String, String>>,

    #[ion(parser = |v| parse_body(cx, v))]
    pub(super) body: Option<Bytes>,
}

fn parse_headers<'cx>(cx: &'cx Context, v: Value<'cx>) -> ion::Result<HashMap<String, String>> {
    if v.handle().is_null() {
        return Ok(Default::default());
    }

    let o = v.to_object(cx);
    let mut res = HashMap::new();
    for key in o.keys(cx, Some(IteratorFlags::OWN_ONLY)) {
        let OwnedKey::String(key_str) = key.to_owned_key(cx) else {
            return Err(ion::Error::new(
                "Header keys must be strings",
                ion::ErrorKind::Type,
            ));
        };
        let val = o.get(cx, key).unwrap();
        let val_str = unsafe { <String as FromValue>::from_value(cx, &val, false, ()) }?;
        res.insert(key_str, val_str);
    }
    Ok(res)
}

fn parse_body<'cx>(cx: &'cx Context, v: Value<'cx>) -> ion::Result<Bytes> {
    if v.handle().is_string() {
        let str = unsafe { <String as FromValue>::from_value(cx, &v, false, ()) }?;
        Ok(Bytes::from(str.into_bytes()))
    } else {
        let v = v.to_object(cx);
        if let Ok(arr) = mozjs::typedarray::ArrayBuffer::from(v.handle().get()) {
            Ok(Bytes::from(unsafe { arr.as_slice() }.to_owned()))
        } else if let Ok(arr) = mozjs::typedarray::ArrayBufferView::from(v.handle().get()) {
            Ok(Bytes::from(unsafe { arr.as_slice() }.to_owned()))
        } else if let Ok(arr) = mozjs::typedarray::Uint8Array::from(v.handle().get()) {
            Ok(Bytes::from(unsafe { arr.as_slice() }.to_owned()))
        } else {
            return Err(ion::Error::new(
                "Unexpected type for response.body",
                ion::ErrorKind::Type,
            ));
        }
    }
}
