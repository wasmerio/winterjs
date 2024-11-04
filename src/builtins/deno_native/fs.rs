#![allow(unused_braces)] // Quirk of the derive macros?

use std::{cell::RefCell, collections::HashMap, os::fd::AsRawFd};

#[cfg(unix)]
use std::os::unix::fs::MetadataExt;

#[cfg(target_vendor = "wasmer")]
use std::os::wasi::fs::MetadataExt;

use ion::{
    conversions::ConversionBehavior, flags::PropertyFlags, function::Opt, function_spec, Context,
    Heap, Object,
};
use mozjs::jsapi::{JSFunctionSpec, JSObject};
use runtime::promise::future_to_promise;
use tokio::io::AsyncWriteExt;

use crate::{ion_err, ion_mk_err};

type Fd = i32;

thread_local! {
    static OPEN_FILES: RefCell<HashMap<Fd, std::fs::File>> = RefCell::new(HashMap::new());
}

#[derive(FromValue, Debug)]
pub struct FileOpenOptions {
    #[ion(convert = ConversionBehavior::Clamp)]
    #[allow(unused)]
    mode: Option<u32>,

    append: Option<bool>,
    create: Option<bool>,
    create_new: Option<bool>,
    read: Option<bool>,
    truncate: Option<bool>,
    write: Option<bool>,
}

#[derive(ToValue, Debug)]
pub struct File {
    #[ion(convert = ConversionBehavior::Clamp)]
    pub rid: i32,
}

#[derive(ToValue, Debug)]
pub struct DirEntry {
    pub name: String,
    pub is_file: bool,
    pub is_directory: bool,
    pub is_symlink: bool,
}

#[derive(ToValue, Debug)]
pub struct Stat {
    #[ion(convert = ConversionBehavior::Clamp)]
    dev: u64,
    #[ion(convert = ConversionBehavior::Clamp)]
    ino: u64,
    #[ion(convert = ConversionBehavior::Clamp)]
    mode: u32,
    #[ion(convert = ConversionBehavior::Clamp)]
    nlink: u64,
    #[ion(convert = ConversionBehavior::Clamp)]
    uid: u32,
    #[ion(convert = ConversionBehavior::Clamp)]
    gid: u32,
    #[ion(convert = ConversionBehavior::Clamp)]
    rdev: u64,
    #[ion(convert = ConversionBehavior::Clamp)]
    size: u64,
    #[ion(convert = ConversionBehavior::Clamp)]
    blksize: u64,
    #[ion(convert = ConversionBehavior::Clamp)]
    blocks: u64,
    mtime: Heap<*mut JSObject>,
    atime: Heap<*mut JSObject>,
    birthtime: Heap<*mut JSObject>,
    is_file: bool,
    is_directory: bool,
    is_symlink: bool,
}

impl Stat {
    fn from_metadata(cx: &Context, stat: &std::fs::Metadata) -> Self {
        let (
            mode,
            uid,
            gid,
            rdev,
            blksize,
            blocks,
            mtime,
            mtime_nsec,
            atime,
            atime_nsec,
            ctime,
            ctime_nsec,
        ) = {
            #[cfg(unix)]
            {
                (
                    stat.mode(),
                    stat.uid(),
                    stat.gid(),
                    stat.rdev(),
                    stat.blksize(),
                    stat.blocks(),
                    stat.mtime(),
                    stat.mtime_nsec().try_into().unwrap(),
                    stat.atime(),
                    stat.atime_nsec().try_into().unwrap(),
                    stat.ctime(),
                    stat.ctime_nsec().try_into().unwrap(),
                )
            }

            // TODO: why are the timestamps broken under WASIX?
            #[cfg(target_vendor = "wasmer")]
            {
                (
                    0o666,
                    1,
                    1,
                    0,
                    4096,
                    (stat.size() >> 12) + 1,
                    1,
                    0,
                    1,
                    0,
                    1,
                    0,
                )
            }
        };

        Self {
            dev: stat.dev(),
            ino: stat.ino(),
            mode,
            nlink: stat.nlink(),
            uid,
            gid,
            rdev,
            size: stat.size(),
            blksize,
            blocks,
            mtime: Heap::new(unix_timestamp_to_js_date(cx, mtime, mtime_nsec).get()),
            atime: Heap::new(unix_timestamp_to_js_date(cx, atime, atime_nsec).get()),
            birthtime: Heap::new(unix_timestamp_to_js_date(cx, ctime, ctime_nsec).get()),
            is_file: stat.is_file(),
            is_directory: stat.is_dir(),
            is_symlink: stat.is_symlink(),
        }
    }
}

macro_rules! io_err_to_ion {
    ($desc:expr, $e:ident) => {
        ion_mk_err!(format!($desc, $e.kind()), Normal)
    };
}

fn unix_timestamp_to_js_date(cx: &Context, timestamp: i64, nsecs: u32) -> ion::Date {
    ion::Date::from_date(
        cx,
        chrono::DateTime::<chrono::Utc>::from_timestamp(timestamp, nsecs).expect("Bad timestamp"),
    )
}

#[js_fn]
fn cwd() -> ion::Result<String> {
    Ok(std::env::current_dir()
        .map_err(|e| io_err_to_ion!("Failed to get cwd due to {}", e))?
        .to_string_lossy()
        .into_owned())
}

#[js_fn]
fn open(cx: &Context, file_path: String, Opt(options): Opt<FileOpenOptions>) -> ion::Promise {
    unsafe {
        future_to_promise::<_, _, _, ion::Error>(cx, move |_| async move {
            let file = tokio::fs::OpenOptions::from(get_open_options(options))
                .open(&file_path)
                .await
                .map_err(|e| {
                    ion_mk_err!(format!("Cannot open file due to: {}", e.kind()), Normal)
                })?;

            let std_file = file.into_std().await;
            let fd = std_file.as_raw_fd();

            OPEN_FILES.with(|c| c.borrow_mut().insert(fd, std_file));

            Ok(File { rid: fd })
        })
        .unwrap()
    }
}

#[js_fn]
fn open_sync(file_path: String, Opt(options): Opt<FileOpenOptions>) -> ion::Result<File> {
    let file = get_open_options(options)
        .open(&file_path)
        .map_err(|e| ion_mk_err!(format!("Cannot open file due to: {}", e.kind()), Normal))?;

    let fd = file.as_raw_fd();

    OPEN_FILES.with(|c| c.borrow_mut().insert(fd, file));

    Ok(File { rid: fd })
}

// TODO: support mode
fn get_open_options(options: Option<FileOpenOptions>) -> std::fs::OpenOptions {
    let mut result = std::fs::OpenOptions::new();
    result
        .append(matches!(
            options,
            Some(FileOpenOptions {
                append: Some(true),
                ..
            })
        ))
        .create(matches!(
            options,
            Some(FileOpenOptions {
                create: Some(true),
                ..
            })
        ))
        .create_new(matches!(
            options,
            Some(FileOpenOptions {
                create_new: Some(true),
                ..
            })
        ))
        .read(matches!(
            options,
            Some(FileOpenOptions {
                read: Some(true),
                ..
            })
        ))
        .truncate(matches!(
            options,
            Some(FileOpenOptions {
                truncate: Some(true),
                ..
            })
        ))
        .write(matches!(
            options,
            Some(FileOpenOptions {
                write: Some(true),
                ..
            })
        ));
    result
}

#[js_fn]
fn close(cx: &Context, #[ion(convert = ConversionBehavior::Clamp)] fd: Fd) -> ion::Promise {
    unsafe {
        future_to_promise(cx, move |_| async move {
            let file = OPEN_FILES.with(|c| c.borrow_mut().remove(&fd));
            match file {
                Some(f) => {
                    let mut tokio_file = tokio::fs::File::from_std(f);
                    tokio_file.flush().await?;
                    drop(tokio_file);
                    Ok(())
                }
                None => ion_err!("No such file was open", Normal),
            }
        })
        .unwrap()
    }
}

#[js_fn]
fn close_sync(#[ion(convert = ConversionBehavior::Clamp)] fd: Fd) -> ion::Result<()> {
    let file = OPEN_FILES.with(|c| c.borrow_mut().remove(&fd));
    match file {
        Some(f) => {
            drop(f);
            Ok(())
        }
        None => ion_err!("No such file was open", Normal),
    }
}

#[js_fn]
fn stat(cx: &Context, path: String) -> ion::Promise {
    unsafe {
        future_to_promise::<_, _, _, ion::Error>(cx, move |cx| async move {
            let stat = tokio::fs::metadata(path)
                .await
                .map_err(|e| io_err_to_ion!("Failed to get path stat due to {}", e))?;

            Ok(Stat::from_metadata(&cx, &stat))
        })
        .unwrap()
    }
}

#[js_fn]
fn stat_sync(cx: &Context, path: String) -> ion::Result<Stat> {
    let stat = std::fs::metadata(path)
        .map_err(|e| io_err_to_ion!("Failed to get path stat due to {}", e))?;

    Ok(Stat::from_metadata(cx, &stat))
}

#[js_fn]
fn real_path(cx: &Context, path: String) -> ion::Promise {
    unsafe { future_to_promise(cx, move |cx| async move { real_path_impl(&cx, path) }).unwrap() }
}

#[js_fn]
fn real_path_sync(cx: &Context, path: String) -> ion::ResultExc<String> {
    real_path_impl(cx, path)
}

fn real_path_impl(cx: &Context, path: String) -> ion::ResultExc<String> {
    match runtime::wasi_polyfills::canonicalize(&path) {
        Ok(p) => Ok(p.to_string_lossy().into_owned()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            let normalized = runtime::wasi_polyfills::normalize(&path);
            let error_obj = Object::new(cx);
            error_obj.set_as(
                cx,
                "path",
                &normalized
                    .map(|p| p.to_string_lossy().into_owned())
                    .unwrap_or(path),
            );
            Err(ion::Exception::Other(
                ion::Value::object(cx, &error_obj).get(),
            ))
        }
        Err(e) => Err(ion::Exception::Error(io_err_to_ion!(
            "Failed to canonicalize path due to {}",
            e
        ))),
    }
}

#[js_fn]
fn read_file(cx: &Context, path: String) -> ion::Promise {
    unsafe {
        future_to_promise::<_, _, _, ion::Exception>(cx, move |cx| async move {
            let contents = tokio::fs::read(path)
                .await
                .map_err(|e| io_err_to_ion!("Can't read file due to {}", e))?;
            Ok((*super::util::make_buffer(&cx, &contents)?).get())
        })
        .unwrap()
    }
}

#[js_fn]
fn read_file_sync(cx: &Context, path: String) -> ion::ResultExc<*mut JSObject> {
    let contents =
        std::fs::read(path).map_err(|e| io_err_to_ion!("Can't read file due to {}", e))?;
    Ok((*super::util::make_buffer(cx, &contents)?).get())
}

// TODO: implement async read_dir, requires an async iterable

#[js_fn]
fn read_dir_sync(path: String) -> ion::Result<Vec<DirEntry>> {
    let entries = std::fs::read_dir(&path)
        .map_err(|e| io_err_to_ion!("Failed to read directory due to: {}", e))?;
    let mut result = vec![];
    for entry in entries {
        let entry =
            entry.map_err(|e| io_err_to_ion!("Failed to read directory entry due to: {}", e))?;
        let file_type = entry
            .file_type()
            .map_err(|e| io_err_to_ion!("Failed to read directory entry type due to: {}", e))?;
        result.push(DirEntry {
            name: entry.file_name().into_string().unwrap(),
            is_file: file_type.is_file(),
            is_directory: file_type.is_dir(),
            is_symlink: file_type.is_symlink(),
        });
    }
    Ok(result)
}

const FUNCTIONS: &[JSFunctionSpec] = &[
    function_spec!(cwd, "cwd", 0, PropertyFlags::CONSTANT),
    function_spec!(open, "open", 2, PropertyFlags::CONSTANT),
    function_spec!(open_sync, "openSync", 2, PropertyFlags::CONSTANT),
    function_spec!(close, "close", 1, PropertyFlags::CONSTANT),
    function_spec!(close_sync, "closeSync", 1, PropertyFlags::CONSTANT),
    function_spec!(stat, "stat", 1, PropertyFlags::CONSTANT),
    function_spec!(stat_sync, "statSync", 1, PropertyFlags::CONSTANT),
    function_spec!(real_path, "realPath", 1, PropertyFlags::CONSTANT),
    function_spec!(real_path_sync, "realPathSync", 1, PropertyFlags::CONSTANT),
    function_spec!(read_file, "readFile", 1, PropertyFlags::CONSTANT),
    function_spec!(read_file_sync, "readFileSync", 1, PropertyFlags::CONSTANT),
    function_spec!(read_dir_sync, "readDirSync", 1, PropertyFlags::CONSTANT),
    JSFunctionSpec::ZERO,
];

pub fn define(cx: &Context, deno: &Object) -> bool {
    unsafe { deno.define_methods(cx, FUNCTIONS) }
}
