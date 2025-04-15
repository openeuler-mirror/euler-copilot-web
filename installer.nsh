# Custom NSIS script

# 预初始化时，根据机器位数决定默认安装路径

!include "x64.nsh"
!include "LogicLib.nsh" 

Var INSTALL_PATH

!macro preInit
  ${If} ${RunningX64}
    SetRegView 64
    StrCpy $INSTALL_PATH "C:\Program Files\eulercopilot"
  ${Else}
    SetRegView 32
    StrCpy $INSTALL_PATH "C:\Program Files (x86)\eulercopilot"
  ${EndIf}

  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTALL_PATH"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTALL_PATH"
!macroend
