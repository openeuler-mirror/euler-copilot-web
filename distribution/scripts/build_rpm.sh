#!/usr/bin/env bash
# Exit on error and unset vars
set -euo pipefail

# 脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 项目根目录
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# 构建输出目录
BUILD_DIR="${PROJECT_ROOT}/build"
mkdir -p "${BUILD_DIR}"

# spec 文件路径
SPEC="${PROJECT_ROOT}/distribution/linux/euler-copilot-web.spec"

# 从 spec 文件获取 Name 和 Version
name=$(grep -E '^Name:' "${SPEC}" | head -1 | awk '{print $2}')
version=$(grep -E '^Version:' "${SPEC}" | head -1 | awk '{print $2}')
tarball="${name}-${version}.tar.gz"
tarball_path="${BUILD_DIR}/${tarball}"

# 1. 生成源码包到 build 目录
if [ ! -f "${tarball_path}" ]; then
  echo "生成源码包 ${tarball_path}..."
  bash "${SCRIPT_DIR}/package_repository.sh"
fi

# 2. 初始化 rpmbuild 目录到 build 目录
RPMBUILD_DIR="${BUILD_DIR}/rpmbuild"
mkdir -p "${RPMBUILD_DIR}"/{BUILD,RPMS,SOURCES,SPECS,SRPMS}

# 3. 准备 SPEC 和 SOURCES
cp "${SPEC}" "${RPMBUILD_DIR}/SPECS/"
cp "${tarball_path}" "${RPMBUILD_DIR}/SOURCES/"

# 4. 执行 rpmbuild
echo "开始构建 RPM 包..."
rpmbuild --define "_topdir ${RPMBUILD_DIR}" -ba "${RPMBUILD_DIR}/SPECS/$(basename "${SPEC}")"

echo "RPM 包构建完成，输出在 ${RPMBUILD_DIR}/RPMS 和 ${RPMBUILD_DIR}/SRPMS"
