use ion::{conversions::ToValue, Context, Exception, Function, Object, Value};

use crate::ion_mk_err;

pub fn get_builtin_module<'cx>(cx: &'cx Context, name: &str) -> ion::ResultExc<Object<'cx>> {
    let module = crate::sm_utils::get_evaluated_known_module(cx, format!("node:{name}"))?;
    Ok(module.module_namespace(cx))
}

pub fn get_builtin_function<'cx>(
    cx: &'cx Context,
    module_name: &str,
    function_name: &str,
) -> ion::ResultExc<Function<'cx>> {
    get_builtin_module(cx, module_name)?
        .get_as::<_, Function>(cx, function_name, true, ())?
        .ok_or_else(|| {
            Exception::Error(ion_mk_err!(
                format!("Failed to find built-in type node:{module_name}.{function_name}"),
                Normal
            ))
        })
}

pub fn get_builtin_type<'cx>(
    cx: &'cx Context,
    module_name: &str,
    type_name: &str,
) -> ion::ResultExc<Function<'cx>> {
    let result = get_builtin_function(cx, module_name, type_name)?;

    if result.is_constructor() {
        Ok(result)
    } else {
        Err(ion::Exception::Error(ion_mk_err!(
            format!("Function node:{module_name}.{type_name} is not a constructor"),
            Normal
        )))
    }
}

pub fn make_buffer(cx: &Context, contents: impl AsRef<[u8]>) -> ion::ResultExc<Object> {
    let buffer_contructor = get_builtin_type(cx, "buffer", "Buffer")?;

    let array_buffer = ion::object::typedarray::ArrayBuffer::copy_from_bytes(cx, contents.as_ref())
        .ok_or_else(|| ion_mk_err!("Failed to allocate ArrayBuffer", Normal))?;
    let mut array_val = Value::undefined(cx);
    array_buffer.to_value(cx, &mut array_val);

    buffer_contructor.construct(cx, &[array_val])
}
