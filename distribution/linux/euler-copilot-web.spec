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

BuildArch:      aarch64 x86_64
Name:           euler-copilot-web
Version:        0.9.6
Release:        1%{?dist}
License:        MulanPSL-2.0 
Group:          Applications/Utilities
Summary:        openEuler 大模型智能系统
Source0:        %{name}-%{version}.tar.gz

URL:            https://gitee.com/openeuler/euler-copilot-web
Vendor:         openEuler <contact@openeuler.org>
Packager:       openEuler <contact@openeuler.org>

BuildRequires:  curl

%description
openEuler 大模型智能系统

%package -n     euler-copilot-desktop
Summary:        openEuler 大模型智能系统桌面客户端
Requires:       at-spi2-core
Requires:       gtk3
Requires:       libXScrnSaver
Requires:       libnotify
Requires:       nss
Requires:       xdg-utils
Requires:       (libXtst or libXtst6)
Requires:       (libuuid or libuuid1)
Requires(post): /bin/sh
Requires(postun): /bin/sh

%description -n euler-copilot-desktop
openEuler 大模型智能系统桌面客户端


%prep
%setup -q


%build
# Extract Node.js version using grep+sed for compatibility
NODE_VER=$(grep '"node":' package.json | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
NODE_LINK="https://registry.npmmirror.com/-/binary/node/v${NODE_VER}/node-v${NODE_VER}-linux-%{_electron_arch}.tar.xz"
# Download and install Node.js into a subdirectory
NODE_HOME=/usr/local/node-v${NODE_VER}
mkdir -p "$NODE_HOME"
curl -sSL "$NODE_LINK" | tar -xJ -C "$NODE_HOME" --strip-components=1
# Set NODE_HOME and update PATH, then test Node.js installation
export NODE_HOME
export PATH="$NODE_HOME/bin:$PATH"
node -v

# Setup mirrors for Electron
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"

# Setup npm mirror
npm config set registry https://registry.npmmirror.com

# Install pnpm globally
corepack enable
corepack prepare pnpm@latest --activate
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
    curl -sSL "https://registry.npmmirror.com/-/binary/electron/$ELECTRON_VER/$PACKAGE_NAME" \
        -o "$CACHE_DIR/$PACKAGE_NAME"
fi

# Install pnpm packages
pnpm install
# Build the app
pnpm run package:linux


%install
mkdir -p %{buildroot}/opt/EulerCopilot
mkdir -p %{buildroot}/usr/share/applications
mkdir -p %{buildroot}/usr/share/icons/hicolor/512x512/apps

# 复制构件到目标目录
cp -a %{_builddir}/%{name}-%{version}/release/euler-copilot-%{version}/%{_electron_build_dir}/* %{buildroot}/opt/EulerCopilot/
# 创建命令行链接
mkdir -p %{buildroot}/usr/bin
ln -sf '/opt/EulerCopilot/euler-copilot-desktop' %{buildroot}/usr/bin/euler-copilot-desktop
# 拷贝桌面入口文件和图标
cp -a %{_builddir}/%{name}-%{version}/distribution/linux/euler-copilot-desktop.desktop %{buildroot}/usr/share/applications/
cp -a %{_builddir}/%{name}-%{version}/distribution/linux/euler-copilot-desktop.png %{buildroot}/usr/share/icons/hicolor/512x512/apps/


%files
# 主包（暂时留空）


%files -n euler-copilot-desktop
# 应用安装目录及其所有内容
%dir /opt/EulerCopilot
%attr(0755, root, root) /opt/EulerCopilot/*
# 命令行链接
/usr/bin/euler-copilot-desktop
# 桌面与图标
%attr(0644, root, root) /usr/share/applications/euler-copilot-desktop.desktop
%attr(0644, root, root) /usr/share/icons/hicolor/512x512/apps/euler-copilot-desktop.png


%post -n euler-copilot-desktop -p /bin/sh
#!/bin/bash

if type update-alternatives 2>/dev/null >&1; then
    # Remove previous link if it doesn't use update-alternatives
    if [ -L '/usr/bin/euler-copilot-desktop' -a -e '/usr/bin/euler-copilot-desktop' -a "`readlink '/usr/bin/euler-copilot-desktop'`" != '/etc/alternatives/euler-copilot-desktop' ]; then
        rm -f '/usr/bin/euler-copilot-desktop'
    fi
    update-alternatives --install '/usr/bin/euler-copilot-desktop' 'euler-copilot-desktop' '/opt/EulerCopilot/euler-copilot-desktop' 100 || ln -sf '/opt/EulerCopilot/euler-copilot-desktop' '/usr/bin/euler-copilot-desktop'
else
    ln -sf '/opt/EulerCopilot/euler-copilot-desktop' '/usr/bin/euler-copilot-desktop'
fi

# Check if user namespaces are supported by the kernel and working with a quick test:
if ! { [[ -L /proc/self/ns/user ]] && unshare --user true; }; then
    # Use SUID chrome-sandbox only on systems without user namespaces:
    chmod 4755 '/opt/EulerCopilot/chrome-sandbox' || true
else
    chmod 0755 '/opt/EulerCopilot/chrome-sandbox' || true
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
  APPARMOR_PROFILE_SOURCE='/opt/EulerCopilot/resources/apparmor-profile'
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
* Thu Apr 17 2025 openEuler <contact@openeuler.org> - 0.9.6-1
- Initial release
