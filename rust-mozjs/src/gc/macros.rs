// Creates a C string literal `$str`.
#[macro_export]
macro_rules! c_str {
    ($str:expr) => {
        concat!($str, "\0").as_ptr() as *const ::std::os::raw::c_char
    };
}

#[macro_export]
macro_rules! rooted {
	(in($cx:expr) let $($var:ident)+ = $init:expr) => {
        let mut __root = $crate::jsapi::Rooted::new_unrooted();
        let $($var)+ = $crate::gc::RootedGuard::new($cx, &mut __root, $init);
    };
	(in($cx:expr) let $($var:ident)+: $type:ty = $init:expr) => {
        let mut __root = $crate::jsapi::Rooted::new_unrooted();
        let $($var)+: $crate::gc::RootedGuard<$type> = $crate::gc::RootedGuard::new($cx, &mut __root, $init);
    };
	(in($cx:expr) let $($var:ident)+: $type:ty) => {
        let mut __root = $crate::jsapi::Rooted::new_unrooted();
        let $($var)+: $crate::gc::RootedGuard<$type> = $crate::gc::RootedGuard::new(
            $cx,
            &mut __root,
            <$type as $crate::gc::GCMethods>::initial(),
        );
    };
}

#[macro_export]
macro_rules! rooted_vec {
    (let mut $name:ident) => {
        let mut __root = $crate::gc::RootableVec::new_unrooted();
        let mut $name = $crate::gc::RootedVec::new(&mut __root);
    };
    (let mut $name:ident: $type:ty) => {
        let mut __root = $crate::gc::RootableVec::new_unrooted();
        let mut $name: $crate::gc::RootedVec<$type> = $crate::gc::RootedVec::new(&mut __root);
    };
    (let $($var:ident)+ = $init:expr) => {
        let mut __root = $crate::gc::RootableVec::new_unrooted();
        let mut $name: $crate::gc::RootedVec<$type> = $crate::gc::RootedVec::new(&mut __root);
        ::std::iter::Extend::extend(&mut $name, $init);
    };
}

#[macro_export]
macro_rules! auto_root {
    (in($cx:expr) let $($var:ident)+ = $init:expr) => {
        let mut __root = $crate::gc::CustomAutoRooter::new($init);
        let $($var)+ = __root.root($cx);
    };
	(in($cx:expr) let $($var:ident)+: $type:ty = $init:expr) => {
        let mut __root = $crate::gc::CustomAutoRooter::new($init);
        let $($var)+: $crate::rust::CustomAutoRootedGuard<$type> = __root.root($cx);
    };
}
