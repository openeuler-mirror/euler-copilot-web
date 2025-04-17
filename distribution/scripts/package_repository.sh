#!/usr/bin/env bash
set -euo pipefail

# 脚本所在目录，用于定位项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 项目根目录
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# 构建输出目录
RELEASE_DIR="${PROJECT_ROOT}/release"
mkdir -p "${RELEASE_DIR}"

# spec 文件路径
SPEC="${PROJECT_ROOT}/distribution/linux/euler-copilot-web.spec"

# 从 spec 文件中读取 Name 和 Version
name=$(grep -E '^Name:' "${SPEC}" | head -1 | awk '{print $2}')
version=$(grep -E '^Version:' "${SPEC}" | head -1 | awk '{print $2}')

# 输出文件名为 name-version.tar.gz
output="${name}-${version}.tar.gz"

# 打包当前 HEAD，忽略 .gitignore，且不包含 .git 目录
# 输出到项目根 release 目录
git archive --format=tar --prefix="${name}/" HEAD | gzip >"${RELEASE_DIR}/${output}"

echo "打包完成：${RELEASE_DIR}/${output}"
