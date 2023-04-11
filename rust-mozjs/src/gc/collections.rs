use std::ops::{Deref, DerefMut};
use gc::{RootedTraceableSet, Traceable};

/// A vector of items to be rooted with `RootedVec`.
/// Guaranteed to be empty when not rooted.
pub struct RootableVec<T: Traceable> {
	v: Vec<T>
}

impl<T: Traceable> RootableVec<T> {
	/// Create a vector of items of type T that can be rooted later.
	pub fn new_unrooted() -> RootableVec<T> {
		RootableVec { v: Vec::new() }
	}
}

/// A vector of items rooted for the lifetime 'a.
pub struct RootedVec<'a, T: Traceable + 'static> {
	root: &'a mut RootableVec<T>,
}

impl<'a, T: Traceable + 'static> RootedVec<'a, T> {
	pub fn new(root: &'a mut RootableVec<T>) -> RootedVec<'a, T> {
		unsafe {
			RootedTraceableSet::add(root);
		}
		RootedVec { root }
	}
}

impl<'a, T: Traceable + 'static> Drop for RootedVec<'a, T> {
	fn drop(&mut self) {
		self.clear();
		unsafe {
			RootedTraceableSet::remove(self.root);
		}
	}
}

impl<'a, T: Traceable> Deref for RootedVec<'a, T> {
	type Target = Vec<T>;
	fn deref(&self) -> &Vec<T> {
		&self.root.v
	}
}

impl<'a, T: Traceable> DerefMut for RootedVec<'a, T> {
	fn deref_mut(&mut self) -> &mut Vec<T> {
		&mut self.root.v
	}
}
