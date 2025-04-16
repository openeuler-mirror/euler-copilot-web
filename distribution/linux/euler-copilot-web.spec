AutoReq: no
%undefine __find_requires
# Be sure buildpolicy set to do nothing
%define __spec_install_post %{nil}
# Something that need for rpm-4.1
%define _missing_doc_files_terminate_build 0


BuildArch:     aarch64 x86_64
Name:          euler-copilot-web
Version:       0.9.6
Release:       1%{?dist}
License:       MulanPSL-2.0 
Group:         Applications/Utilities
Summary:       openEuler 大模型智能系统
Source0:       %{name}-%{version}.tar.gz

URL:           https://gitee.com/openeuler/euler-copilot-web
Vendor:        openEuler <contact@openeuler.org>
Packager:      openEuler <contact@openeuler.org>

Requires:      (libXtst or libXtst6)
Requires:      (libuuid or libuuid1)
Requires(post): /bin/sh
Requires(postun): /bin/sh
Requires:      at-spi2-core
Requires:      gtk3
Requires:      libXScrnSaver
Requires:      libnotify
Requires:      nss
Requires:      xdg-utils

BuildRequires: git
BuildRequires: curl

%description
openEuler 大模型智能系统


%prep
%setup -q -c -T
# Install Linuxbrew
# https://mirrors.tuna.tsinghua.edu.cn/help/homebrew/
export HOMEBREW_BREW_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git"
export HOMEBREW_CORE_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git"
export HOMEBREW_API_DOMAIN="https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles/api"
export HOMEBREW_BOTTLE_DOMAIN="https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles"
export HOMEBREW_PIP_INDEX_URL="https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple"

git clone --depth=1 https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/install.git brew-install
/bin/bash brew-install/install.sh
rm -rf brew-install

test -d ~/.linuxbrew && eval "$(~/.linuxbrew/bin/brew shellenv)"
test -d /home/linuxbrew/.linuxbrew && eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
echo "eval \"\$($(brew --prefix)/bin/brew shellenv)\"" >> ~/.bashrc

# Install nodejs@22 & pnpm
brew install node@22
corepack enable pnpm

# Setup npm mirror
npm config set registry https://registry.npmmirror.com
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/

# Install pnpm packages
pnpm install


%build
# Build the app
pnpm run package:linux


%install
mkdir -p %{buildroot}/opt/EulerCopilot
mkdir -p %{buildroot}/opt/EulerCopilot/resources
mkdir -p %{buildroot}/usr/share/applications
mkdir -p %{buildroot}/usr/share/icons/hicolor/512x512/apps


%files
%attr(0644, root, root) "/usr/share/applications/euler-copilot-desktop.desktop"
%attr(0644, root, root) "/usr/share/icons/hicolor/512x512/apps/euler-copilot-desktop.png"


%post -p /bin/sh
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


%postun -p /bin/sh
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

