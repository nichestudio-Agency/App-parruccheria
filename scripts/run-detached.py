#!/usr/bin/env python3

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path


def port_is_listening(port: int) -> bool:
    result = subprocess.run(
        ["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.returncode == 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pid-file", required=True)
    parser.add_argument("--log-file", required=True)
    parser.add_argument("--cwd", required=True)
    parser.add_argument("--port", type=int)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()

    command = args.command
    if command and command[0] == "--":
        command = command[1:]
    if not command:
        print("Missing command to execute.", file=sys.stderr)
        return 1

    pid_path = Path(args.pid_file)
    log_path = Path(args.log_file)
    pid_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    with open(log_path, "wb") as log_file:
        process = subprocess.Popen(
            command,
            cwd=args.cwd,
            stdin=subprocess.DEVNULL,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            start_new_session=True,
            env=env,
        )

    pid_path.write_text(f"{process.pid}\n", encoding="ascii")

    time.sleep(3)
    if process.poll() is not None:
        pid_path.unlink(missing_ok=True)
        return 1

    if args.port is not None:
        for _ in range(20):
            if port_is_listening(args.port):
                return 0
            if process.poll() is not None:
                pid_path.unlink(missing_ok=True)
                return 1
            time.sleep(1)
        pid_path.unlink(missing_ok=True)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
