AutoReq: no
%undefine __find_requires
# Be sure buildpolicy set to do nothing
%define __spec_install_post %{nil}
# Something that need for rpm-4.1
%define _missing_doc_files_terminate_build 0
# Disable debug package generation
%define debug_package %{nil}

%ifarch aarch64
%define _electron_arch arm64
%define _electron_build_dir linux-arm64-unpacked
%else
%define _electron_arch x64
%define _electron_build_dir linux-unpacked
%endif

BuildArch:        aarch64 x86_64
Name:             euler-copilot-web
Version:          0.9.6
Release:          1%{?dist}
License:          MulanPSL-2.0
Summary:          openEuler 智能化解决方案 Web 前端
Source0:          %{name}-%{version}.tar.gz
Source1:          offline_node_modules-%{_electron_arch}.tar.zst.part0
Source2:          offline_node_modules-%{_electron_arch}.tar.zst.part1
Source3:          offline_node_modules-%{_electron_arch}.tar.zst.part2
Source4:          offline_node_modules-%{_electron_arch}.tar.zst.part3

URL:              https://gitee.com/openeuler/euler-copilot-web
Vendor:           openEuler <contact@openeuler.org>
Packager:         openEuler <contact@openeuler.org>

BuildRequires:    curl
BuildRequires:    zstd

%description
openEuler 智能化解决方案 Web 前端


%package -n       euler-copilot-web-nginx-config
# nginx 配置文件
Summary:          openEuler 智能化解决方案前端 nginx 配置
Requires:         nginx
Requires:         euler-copilot-web = %{version}-%{release}

%description -n   euler-copilot-web-nginx-config
openEuler 智能化解决方案前端的 nginx 配置文件，适用于 Web 前端部署。

%package -n       euler-copilot-desktop
# Electron 客户端
Group:            Applications/Utilities
Summary:          openEuler 智能化解决方案桌面客户端
Requires:         at-spi2-core
Requires:         gtk3
Requires:         libXScrnSaver
Requires:         libnotify
Requires:         nss
Requires:         xdg-utils
Requires:         (libXtst or libXtst6)
Requires:         (libuuid or libuuid1)
Requires(post):   /bin/sh
Requires(postun): /bin/sh

%description -n   euler-copilot-desktop
openEuler 智能化解决方案桌面客户端


%prep
%setup -q


%build
# Extract Node.js version using grep+sed for compatibility
NODE_VER=$(grep '"node":' package.json | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
NODE_LINK="https://mirrors.huaweicloud.com/nodejs/v${NODE_VER}/node-v${NODE_VER}-linux-%{_electron_arch}.tar.xz"
# Download and install Node.js into a subdirectory
NODE_HOME="$PWD/.node-v${NODE_VER}"
mkdir -p "$NODE_HOME"
curl -sSL "$NODE_LINK" | tar -xJ -C "$NODE_HOME" --strip-components=1
# Set NODE_HOME and update PATH, then test Node.js installation
export NODE_HOME
export PATH="$NODE_HOME/bin:$PATH"
node -v

# Setup npm mirror
npm config set registry https://mirrors.huaweicloud.com/repository/npm/

# Setup mirrors for Electron
export ELECTRON_MIRROR="https://mirrors.huaweicloud.com/electron/"

# Install pnpm globally
npm install -g pnpm
pnpm -v

# Download Electron binaries to cache directory
ELECTRON_VER=$(grep -Po '(?<="electron": ")[^"]+' package.json)
PACKAGE_NAME="electron-v$ELECTRON_VER-linux-%{_electron_arch}.zip"
# Electron cache directory
CACHE_DIR="$HOME/.cache/electron"
if [ ! -d "$CACHE_DIR" ]; then
    mkdir -p "$CACHE_DIR"
fi
# Only download if not already present
if [ ! -f "$CACHE_DIR/$PACKAGE_NAME" ]; then
    curl -sSL "https://mirrors.huaweicloud.com/electron/$ELECTRON_VER/$PACKAGE_NAME" \
        -o "$CACHE_DIR/$PACKAGE_NAME"
fi

# 合并并解压离线 node_modules
cat %{_sourcedir}/offline_node_modules-%{_electron_arch}.tar.zst.part0 \
    %{_sourcedir}/offline_node_modules-%{_electron_arch}.tar.zst.part1 \
    %{_sourcedir}/offline_node_modules-%{_electron_arch}.tar.zst.part2 \
    %{_sourcedir}/offline_node_modules-%{_electron_arch}.tar.zst.part3 \
    > offline_node_modules-%{_electron_arch}.tar.zst

if [ -f offline_node_modules-%{_electron_arch}.tar.zst ]; then
    zstd -d offline_node_modules-%{_electron_arch}.tar.zst -c | tar -xf -
fi

# Install pnpm packages
# pnpm install --offline
# Build Electron app
pnpm run package:linux

# Build Web app
pnpm run build


%install

# Web 主包安装
mkdir -p %{buildroot}/usr/share/euler-copilot-web
cp -a %{_builddir}/%{name}-%{version}/dist/. %{buildroot}/usr/share/euler-copilot-web/
chmod -R a+rX %{buildroot}/usr/share/euler-copilot-web

# nginx 配置子包安装
mkdir -p %{buildroot}/etc/nginx/conf.d
cp -a %{_builddir}/%{name}-%{version}/build/linux/nginx.conf.local.tmpl %{buildroot}/etc/nginx/conf.d/euler-copilot-web.conf

# Electron 客户端安装
mkdir -p %{buildroot}/opt/Intelligence
mkdir -p %{buildroot}/usr/share/applications
# 创建图标目录
mkdir -p %{buildroot}/usr/share/icons/hicolor/16x16/apps
mkdir -p %{buildroot}/usr/share/icons/hicolor/24x24/apps
mkdir -p %{buildroot}/usr/share/icons/hicolor/32x32/apps
mkdir -p %{buildroot}/usr/share/icons/hicolor/48x48/apps
mkdir -p %{buildroot}/usr/share/icons/hicolor/64x64/apps
mkdir -p %{buildroot}/usr/share/icons/hicolor/128x128/apps
mkdir -p %{buildroot}/usr/share/icons/hicolor/256x256/apps
mkdir -p %{buildroot}/usr/share/icons/hicolor/256x256@2/apps
mkdir -p %{buildroot}/usr/share/icons/hicolor/512x512/apps

# 复制构件到目标目录
cp -a %{_builddir}/%{name}-%{version}/release/openeuler-intelligence-%{version}/%{_electron_build_dir}/* %{buildroot}/opt/Intelligence/
# 拷贝桌面入口文件和图标
cp -a %{_builddir}/%{name}-%{version}/build/linux/euler-copilot-desktop.desktop %{buildroot}/usr/share/applications/
cp -a %{_builddir}/%{name}-%{version}/build/icons/16x16.png %{buildroot}/usr/share/icons/hicolor/16x16/apps/euler-copilot-desktop.png
cp -a %{_builddir}/%{name}-%{version}/build/icons/24x24.png %{buildroot}/usr/share/icons/hicolor/24x24/apps/euler-copilot-desktop.png
cp -a %{_builddir}/%{name}-%{version}/build/icons/32x32.png %{buildroot}/usr/share/icons/hicolor/32x32/apps/euler-copilot-desktop.png
cp -a %{_builddir}/%{name}-%{version}/build/icons/48x48.png %{buildroot}/usr/share/icons/hicolor/48x48/apps/euler-copilot-desktop.png
cp -a %{_builddir}/%{name}-%{version}/build/icons/64x64.png %{buildroot}/usr/share/icons/hicolor/64x64/apps/euler-copilot-desktop.png
cp -a %{_builddir}/%{name}-%{version}/build/icons/128x128.png %{buildroot}/usr/share/icons/hicolor/128x128/apps/euler-copilot-desktop.png
cp -a %{_builddir}/%{name}-%{version}/build/icons/256x256.png %{buildroot}/usr/share/icons/hicolor/256x256/apps/euler-copilot-desktop.png
cp -a %{_builddir}/%{name}-%{version}/build/icons/256x256@2x.png %{buildroot}/usr/share/icons/hicolor/256x256@2/apps/euler-copilot-desktop.png
cp -a %{_builddir}/%{name}-%{version}/build/icons/512x512.png %{buildroot}/usr/share/icons/hicolor/512x512/apps/euler-copilot-desktop.png


%files
# Web 主包安装内容
%dir /usr/share/euler-copilot-web
%dir /usr/share/euler-copilot-web/assets
%attr(0644, root, root) /usr/share/euler-copilot-web/*.*
%attr(0644, root, root) /usr/share/euler-copilot-web/assets/*


%files -n euler-copilot-web-nginx-config
# nginx 配置文件
%config(noreplace) /etc/nginx/conf.d/euler-copilot-web.conf


%files -n euler-copilot-desktop
# 应用安装目录及其所有内容
%dir /opt/Intelligence
%attr(0755, root, root) /opt/Intelligence/**
# 桌面与图标
%attr(0644, root, root) /usr/share/applications/euler-copilot-desktop.desktop
%attr(0644, root, root) /usr/share/icons/hicolor/16x16/apps/euler-copilot-desktop.png
%attr(0644, root, root) /usr/share/icons/hicolor/24x24/apps/euler-copilot-desktop.png
%attr(0644, root, root) /usr/share/icons/hicolor/32x32/apps/euler-copilot-desktop.png
%attr(0644, root, root) /usr/share/icons/hicolor/48x48/apps/euler-copilot-desktop.png
%attr(0644, root, root) /usr/share/icons/hicolor/64x64/apps/euler-copilot-desktop.png
%attr(0644, root, root) /usr/share/icons/hicolor/128x128/apps/euler-copilot-desktop.png
%attr(0644, root, root) /usr/share/icons/hicolor/256x256/apps/euler-copilot-desktop.png
%attr(0644, root, root) /usr/share/icons/hicolor/256x256@2/apps/euler-copilot-desktop.png
%attr(0644, root, root) /usr/share/icons/hicolor/512x512/apps/euler-copilot-desktop.png


# nginx 配置子包安装后重启 nginx
%post -n euler-copilot-web-nginx-config
#!/bin/bash
# 安装后检测 nginx 服务，若已运行则重启，否则跳过
if systemctl is-active --quiet nginx; then
    systemctl restart nginx
fi


%post -n euler-copilot-desktop -p /bin/sh
#!/bin/bash

if type update-alternatives 2>/dev/null >&1; then
    # Remove previous link if it doesn't use update-alternatives
    if [ -L '/usr/bin/euler-copilot-desktop' -a -e '/usr/bin/euler-copilot-desktop' -a "`readlink '/usr/bin/euler-copilot-desktop'`" != '/etc/alternatives/euler-copilot-desktop' ]; then
        rm -f '/usr/bin/euler-copilot-desktop'
    fi
    update-alternatives --install '/usr/bin/euler-copilot-desktop' 'euler-copilot-desktop' '/opt/Intelligence/euler-copilot-desktop' 100 || ln -sf '/opt/Intelligence/euler-copilot-desktop' '/usr/bin/euler-copilot-desktop'
else
    ln -sf '/opt/Intelligence/euler-copilot-desktop' '/usr/bin/euler-copilot-desktop'
fi

# Check if user namespaces are supported by the kernel and working with a quick test:
if ! { [[ -L /proc/self/ns/user ]] && unshare --user true; }; then
    # Use SUID chrome-sandbox only on systems without user namespaces:
    chmod 4755 '/opt/Intelligence/chrome-sandbox' || true
else
    chmod 0755 '/opt/Intelligence/chrome-sandbox' || true
fi

if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi

if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi

# Install apparmor profile. (Ubuntu 24+)
# First check if the version of AppArmor running on the device supports our profile.
# This is in order to keep backwards compatibility with Ubuntu 22.04 which does not support abi/4.0.
# In that case, we just skip installing the profile since the app runs fine without it on 22.04.
#
# Those apparmor_parser flags are akin to performing a dry run of loading a profile.
# https://wiki.debian.org/AppArmor/HowToUse#Dumping_profiles
#
# Unfortunately, at the moment AppArmor doesn't have a good story for backwards compatibility.
# https://askubuntu.com/questions/1517272/writing-a-backwards-compatible-apparmor-profile
if apparmor_status --enabled > /dev/null 2>&1; then
    APPARMOR_PROFILE_SOURCE='/opt/Intelligence/resources/apparmor-profile'
    APPARMOR_PROFILE_TARGET='/etc/apparmor.d/euler-copilot-desktop'
    if apparmor_parser --skip-kernel-load --debug "$APPARMOR_PROFILE_SOURCE" > /dev/null 2>&1; then
        cp -f "$APPARMOR_PROFILE_SOURCE" "$APPARMOR_PROFILE_TARGET"

        # Updating the current AppArmor profile is not possible and probably not meaningful in a chroot'ed environment.
        # Use cases are for example environments where images for clients are maintained.
        # There, AppArmor might correctly be installed, but live updating makes no sense.
        if ! { [ -x '/usr/bin/ischroot' ] && /usr/bin/ischroot; } && hash apparmor_parser 2>/dev/null; then
            # Extra flags taken from dh_apparmor:
            # > By using '-W -T' we ensure that any abstraction updates are also pulled in.
            # https://wiki.debian.org/AppArmor/Contribute/FirstTimeProfileImport
            apparmor_parser --replace --write-cache --skip-read-cache "$APPARMOR_PROFILE_TARGET"
        fi
    else
        echo "Skipping the installation of the AppArmor profile as this version of AppArmor does not seem to support the bundled profile"
    fi
fi


%postun -n euler-copilot-desktop -p /bin/sh
#!/bin/bash

# Delete the link to the binary
if type update-alternatives >/dev/null 2>&1; then
    update-alternatives --remove 'euler-copilot-desktop' '/usr/bin/euler-copilot-desktop'
else
    rm -f '/usr/bin/euler-copilot-desktop'
fi

APPARMOR_PROFILE_DEST='/etc/apparmor.d/euler-copilot-desktop'

# Remove apparmor profile.
if [ -f "$APPARMOR_PROFILE_DEST" ]; then
    rm -f "$APPARMOR_PROFILE_DEST"
fi


%changelog
* Tue Jun 03 2025 openEuler <contact@openeuler.org> - 0.9.6-2
- 拆分 nginx 配置和重启服务到 euler-copilot-web-nginx-config 子包

* Thu Apr 17 2025 openEuler <contact@openeuler.org> - 0.9.6-1
- Initial release
