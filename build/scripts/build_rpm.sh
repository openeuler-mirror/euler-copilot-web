#!/usr/bin/env bash
# Exit on error and unset vars
set -euo pipefail

# 检查是否以 root 身份运行
if [ "$(id -u)" -ne 0 ]; then
    echo "错误: 此脚本必须以 root 身份运行" >&2
    exit 1
fi

# 脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 项目根目录
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# 构建输出目录
RELEASE_DIR="${PROJECT_ROOT}/release"
mkdir -p "${RELEASE_DIR}"
# 清理上次构建残留
rm -rf "${RELEASE_DIR}/rpmbuild"
rm -f "${RELEASE_DIR}"/*.tar.gz

# spec 文件路径
SPEC="${PROJECT_ROOT}/build/linux/euler-copilot-web.spec"

# 从 spec 文件获取 Name 和 Version
name=$(grep -E '^Name:' "${SPEC}" | head -1 | awk '{print $2}')
version=$(grep -E '^Version:' "${SPEC}" | head -1 | awk '{print $2}')
tarball="${name}-${version}.tar.gz"
tarball_path="${RELEASE_DIR}/${tarball}"

# 1. 生成源码包到 release 目录
if [ ! -f "${tarball_path}" ]; then
    echo "生成源码包 ${tarball_path}..."
    bash "${SCRIPT_DIR}/package_repository.sh"
fi

# 1.5 检测架构并准备离线 node 依赖
ARCH=$(uname -m)
if [[ "$ARCH" == "x86_64" ]]; then
    ARCH_SUFFIX="x64"
elif [[ "$ARCH" == "aarch64" ]]; then
    ARCH_SUFFIX="arm64"
else
    echo "不支持的架构: $ARCH" >&2
    exit 2
fi
# 检查分块文件是否存在，不存在则生成
NEED_GEN=0
for i in 0 1 2 3; do
    if [ ! -f "${RELEASE_DIR}/offline_node_modules-${ARCH_SUFFIX}.tar.gz.part${i}" ] || [ ! -f "${RELEASE_DIR}/offline_pnpm_store-${ARCH_SUFFIX}.tar.gz.part${i}" ]; then
        NEED_GEN=1
    fi
done
if [ "$NEED_GEN" -eq 1 ]; then
    echo "生成离线依赖..."
    bash "${SCRIPT_DIR}/prepare_node_modules_offline.sh"
fi

# 2. 初始化 rpmbuild 目录到 release 目录
RPMBUILD_DIR="${RELEASE_DIR}/rpmbuild"
mkdir -p "${RPMBUILD_DIR}"/{BUILD,RPMS,SOURCES,SPECS,SRPMS}

# 3. 准备 SPEC 和 SOURCES
cp "${SPEC}" "${RPMBUILD_DIR}/SPECS/"
cp "${tarball_path}" "${RPMBUILD_DIR}/SOURCES/"

# 3.5 复制离线依赖包分块到 SOURCES
for i in 0 1 2 3; do
    cp "${RELEASE_DIR}/offline_node_modules-${ARCH_SUFFIX}.tar.gz.part${i}" "${RPMBUILD_DIR}/SOURCES/"
    cp "${RELEASE_DIR}/offline_pnpm_store-${ARCH_SUFFIX}.tar.gz.part${i}" "${RPMBUILD_DIR}/SOURCES/"
done

# 4. 执行 rpmbuild
echo "开始构建 RPM 包..."
rpmbuild --define "_topdir ${RPMBUILD_DIR}" -ba "${RPMBUILD_DIR}/SPECS/$(basename "${SPEC}")"

echo "RPM 包构建完成，输出在 ${RPMBUILD_DIR}/RPMS 和 ${RPMBUILD_DIR}/SRPMS"

# 移动构建好的 rpm 包到 release 目录
find "${RPMBUILD_DIR}/RPMS" -type f -name '*.rpm' -exec cp -f {} "${RELEASE_DIR}/" \;
echo "所有 RPM 包已移动到 ${RELEASE_DIR}"
