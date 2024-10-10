use std::{
    io::Write,
    path::{Path, PathBuf},
};

use anyhow::{bail, Context};
use clap::Parser;
use fast_glob::glob_match;

fn main() -> anyhow::Result<()> {
    let args = CliArgs::parse();

    let function_list = read_function_list(&args.functions)?;

    let wasm_functions = read_wasm_functions(&args.input)?;

    let mut out_file = std::fs::File::options()
        .create(true)
        .truncate(true)
        .write(true)
        .open(&args.output)
        .context("Failed to open output file")?;

    let mut is_first = true;
    'func_names: for func_name in &wasm_functions {
        for pattern in &function_list {
            if glob_match(pattern, func_name) {
                if is_first {
                    is_first = false;
                } else {
                    write!(out_file, ",").context("Failed to write to output file")?;
                }

                write!(out_file, "{func_name}").context("Failed to write to output file")?;
                continue 'func_names;
            }
        }
    }

    writeln!(out_file).context("Failed to write to output file")?;

    Ok(())
}

fn read_wasm_functions(path: impl AsRef<Path>) -> anyhow::Result<Vec<String>> {
    let module = std::fs::read(path).context("Failed to read input WASM module")?;
    let mut module_bytes: &[u8] = module.as_ref();
    let mut parser = wasmparser::Parser::new(0);
    let mut result = vec![];

    loop {
        let (payload, consumed) = match parser
            .parse(module_bytes, true)
            .context("Failed to parse WASM module")?
        {
            wasmparser::Chunk::NeedMoreData(..) => unreachable!(),
            wasmparser::Chunk::Parsed { consumed, payload } => (payload, consumed),
        };

        module_bytes = &module_bytes[consumed..];

        match payload {
            wasmparser::Payload::CustomSection(custom) => {
                let known = custom.as_known();
                match known {
                    wasmparser::KnownCustom::Name(name) => {
                        for name in name {
                            let name =
                                name.context("Failed to read name section from WASM module")?;
                            match name {
                                wasmparser::Name::Function(name_map) => {
                                    for naming in name_map {
                                        let naming = naming
                                            .context("Failed to read naming from WASM module")?;
                                        result.push(naming.name.to_owned());
                                    }
                                }

                                _ => continue,
                            }
                        }
                    }

                    _ => continue,
                }
            }

            wasmparser::Payload::End(..) => break,

            _ => continue,
        }
    }

    if result.is_empty() {
        bail!("Couldn't find a function name section within the WASM module");
    }

    Ok(result)
}

fn read_function_list(funcs: &FunctionListGroup) -> anyhow::Result<Vec<String>> {
    if let Some(ref list_file) = funcs.list_file {
        Ok(std::fs::read_to_string(list_file)
            .context("Failed to read function list file")?
            .lines()
            .map(ToOwned::to_owned)
            .collect())
    } else {
        Ok(funcs.names.clone())
    }
}

#[derive(clap::Parser, Debug)]
#[clap(version)]
struct CliArgs {
    #[clap(short, long)]
    output: PathBuf,

    input: PathBuf,

    #[clap(flatten)]
    functions: FunctionListGroup,
}

#[derive(clap::Parser, Debug)]
#[group(required = true, multiple = false)]
struct FunctionListGroup {
    #[clap(short = 'f', long = "function-name")]
    names: Vec<String>,

    #[clap(short = 'l', long)]
    list_file: Option<PathBuf>,
}
