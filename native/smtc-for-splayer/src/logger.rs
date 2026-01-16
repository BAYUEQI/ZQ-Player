use anyhow::{Context, Result};
use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;
use tracing::{error, trace};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling::RollingFileAppender;
use tracing_subscriber::{filter::LevelFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};

static LOG_GUARD: OnceLock<WorkerGuard> = OnceLock::new();

pub fn init(log_dir_str: String) -> Result<()> {
    let log_path = PathBuf::from(log_dir_str);

    if !log_path.exists() {
        fs::create_dir_all(&log_path).context("无法创建日志目录")?;
    }

    let file_appender = RollingFileAppender::builder()
        .rotation(tracing_appender::rolling::Rotation::DAILY)
        .filename_prefix("smtc-for-splayer")
        .filename_suffix("log")
        .max_log_files(3)
        .build(&log_path)
        .context("无法创建日志文件 Appender")?;

    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    if LOG_GUARD.set(guard).is_err() {
        error!("Logger Guard 已经被初始化，不应重复调用 init()");
        return Ok(());
    }

    let file_layer = fmt::layer()
        .with_writer(non_blocking)
        .with_ansi(false)
        .with_file(true)
        .with_line_number(true)
        .with_thread_ids(true)
        .with_target(true);

    let stdout_layer = fmt::layer()
        .with_writer(std::io::stdout)
        .with_ansi(true)
        .pretty();

    tracing_subscriber::registry()
        .with(LevelFilter::INFO)
        .with(file_layer)
        .with(stdout_layer)
        .try_init()
        .context("无法初始化 Tracing subscriber")?;

    trace!(path = ?log_path, "日志系统初始化完成");

    Ok(())
}
