/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * vim: set ts=8 sts=4 et sw=4 tw=99:
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifdef JS_POSIX_NSPR

/*
 * This NSPR implementation requires Windows Vista or higher; the rest of Gecko/SM
 * is built only to require WinXP at compile time (other functions are dynamically
 * loaded).  So, for this file only, we bump _WIN32_WINNT to indicate that we want
 * Vista+ functionality (0x0600).  For more fun, the location of the synchronization
 * primitives changed -- in the Windows 8 SDK, it moved to <SynchAPI.h>.
 */
#ifdef _WIN32_WINNT
#if _WIN32_WINNT < 0x0600
#undef _WIN32_WINNT
#define _WIN32_WINNT 0x0600
#endif
#else
#define _WIN32_WINNT 0x0600
#endif

#define WIN32_LEAN_AND_MEAN 1
#include <windows.h>
#if _WIN32_MAXVER >= _WIN32_WINNT_WIN8
#include <synchapi.h>
#endif

#include "mozilla/UniquePtr.h"
#include "vm/PosixNSPR.h"
#include "js/Utility.h"

using mozilla::UniquePtr;

// Helper to set thread name with MSVC
#ifdef _MSC_VER
const DWORD MS_VC_EXCEPTION = 0x406D1388;

#pragma pack(push,8)
typedef struct {
    DWORD dwType; // Must be 0x1000.
    LPCSTR szName; // Pointer to name (in user addr space).
    DWORD dwThreadID; // Thread ID (-1=caller thread).
    DWORD dwFlags; // Reserved for future use, must be zero.
} THREADNAME_INFO;
#pragma pack(pop)

static void
SetThreadName(DWORD dwThreadID, const char* threadName)
{
    THREADNAME_INFO info;
    info.dwType = 0x1000;
    info.szName = threadName;
    info.dwThreadID = dwThreadID;
    info.dwFlags = 0;
#pragma warning(push)
#pragma warning(disable: 6320 6322)
    __try {
        RaiseException(MS_VC_EXCEPTION, 0, sizeof(info) / sizeof(ULONG_PTR), (ULONG_PTR*)&info);
    } __except (EXCEPTION_EXECUTE_HANDLER) {
    }
#pragma warning(pop)
}
#else
static void
SetThreadName(DWORD, const char*)
{
}
#endif

struct nspr::Thread
{
    HANDLE thread;
    DWORD threadId;
    void (*start)(void* arg);
    void* arg;
    bool joinable;

    Thread(void (*start)(void* arg), void* arg, bool joinable)
        : thread(0), threadId(0), start(start), arg(arg), joinable(joinable)
    {}

    ~Thread() {
        if (thread)
            CloseHandle(thread);
    }

    static DWORD ThreadRoutine(void* arg);
};

static nspr::Thread gMainThread(nullptr, nullptr, false);

static DWORD gSelfThreadIndex;

DWORD
nspr::Thread::ThreadRoutine(void* arg)
{
    Thread* self = static_cast<Thread*>(arg);
    TlsSetValue(gSelfThreadIndex, self);
    self->start(self->arg);
    if (!self->joinable)
        js_delete(self);
    return 0;
}

static bool gInitialized;

static void
Initialize()
{
    gInitialized = true;

    gSelfThreadIndex = TlsAlloc();
    if (gSelfThreadIndex == TLS_OUT_OF_INDEXES) {
        MOZ_CRASH();
        return;
    }

    TlsSetValue(gSelfThreadIndex, &gMainThread);
}

PRThread*
PR_CreateThread(PRThreadType type,
                void (*start)(void* arg),
                void* arg,
                PRThreadPriority priority,
                PRThreadScope scope,
                PRThreadState state,
                uint32_t stackSize)
{
    MOZ_ASSERT(type == PR_USER_THREAD);
    MOZ_ASSERT(priority == PR_PRIORITY_NORMAL);

    // We assume that the first call to PR_CreateThread happens on the main
    // thread.
    if (!gInitialized)
        Initialize();

    UniquePtr<nspr::Thread> t;
    t.reset(js_new<nspr::Thread>(start, arg, state != PR_UNJOINABLE_THREAD));
    if (!t)
        return nullptr;

    t->thread = CreateThread(NULL, stackSize, &nspr::Thread::ThreadRoutine,
                             t.get(), STACK_SIZE_PARAM_IS_A_RESERVATION, &t->threadId);
    if (!t->thread)
        return nullptr;

    return t.release();
}

PRStatus
PR_JoinThread(PRThread* thread)
{
    if (!thread->joinable)
        return PR_FAILURE;

    WaitForSingleObject(thread->thread, INFINITE);

    js_delete(thread);

    return PR_SUCCESS;
}

PRThread*
PR_GetCurrentThread()
{
    if (!gInitialized)
        Initialize();

    PRThread* thread = static_cast<PRThread *>(TlsGetValue(gSelfThreadIndex));
    if (!thread) {
        thread = js_new<nspr::Thread>(nullptr, nullptr, false);
        if (!thread)
            MOZ_CRASH();
        TlsSetValue(gSelfThreadIndex, thread);
    }
    return thread;
}

PRStatus
PR_SetCurrentThreadName(const char* name)
{
    PRThread* t = PR_GetCurrentThread();
    SetThreadName(t->threadId, name);
    return PR_SUCCESS;
}

class nspr::Lock
{
    SRWLOCK lock_;

  public:
    Lock() : lock_(SRWLOCK_INIT) {}
    SRWLOCK &lock() { return lock_; }
};

PRLock*
PR_NewLock()
{
    return js_new<nspr::Lock>();
}

void
PR_DestroyLock(PRLock* lock)
{
    js_delete(lock);
}

void
PR_Lock(PRLock* lock)
{
    AcquireSRWLockExclusive(&lock->lock());
}

PRStatus
PR_Unlock(PRLock *lock)
{
    ReleaseSRWLockExclusive(&lock->lock());
    return PR_SUCCESS;
}

class nspr::CondVar
{
    CONDITION_VARIABLE cond_;
    nspr::Lock* lock_;

  public:
    explicit CondVar(nspr::Lock* lock) : lock_(lock) {}
    CONDITION_VARIABLE &cond() { return cond_; }
    nspr::Lock* lock() { return lock_; }
};

PRCondVar*
PR_NewCondVar(PRLock* lock)
{
    nspr::CondVar* cvar = js_new<nspr::CondVar>(lock);
    if (!cvar)
        return nullptr;

    InitializeConditionVariable(&cvar->cond());

    return cvar;
}

void
PR_DestroyCondVar(PRCondVar* cvar)
{
    js_delete(cvar);
}

PRStatus
PR_NotifyCondVar(PRCondVar* cvar)
{
    WakeConditionVariable(&cvar->cond());
    return PR_SUCCESS;
}

PRStatus
PR_NotifyAllCondVar(PRCondVar *cvar)
{
    WakeAllConditionVariable(&cvar->cond());
    return PR_SUCCESS;
}

uint32_t
PR_MillisecondsToInterval(uint32_t milli)
{
    return milli;
}

uint32_t
PR_MicrosecondsToInterval(uint32_t micro)
{
    return (micro + 999) / 1000;
}

static const uint64_t TicksPerSecond = 1000;
static const uint64_t NanoSecondsInSeconds = 1000000000;
static const uint64_t MicroSecondsInSeconds = 1000000;

uint32_t
PR_TicksPerSecond()
{
    return TicksPerSecond;
}

PRStatus
PR_WaitCondVar(PRCondVar *cvar, uint32_t timeout)
{
    DWORD msTimeout;
    if (timeout == PR_INTERVAL_NO_TIMEOUT) {
        msTimeout = INFINITE;
    } else {
        msTimeout = timeout;
    }

    if (!SleepConditionVariableSRW(&cvar->cond(),
                                   &cvar->lock()->lock(),
                                   msTimeout, 0))
        return PR_FAILURE;

    return PR_SUCCESS;
}

PRStatus
PR_CallOnce(PRCallOnceType *once, PRCallOnceFN func)
{
    MOZ_CRASH("PR_CallOnce unimplemented");
}

PRStatus
PR_CallOnceWithArg(PRCallOnceType *once, PRCallOnceWithArgFN func, void *arg)
{
    MOZ_CRASH("PR_CallOnceWithArg unimplemented");
}

#endif /* JS_POSIX_NSPR */
