import * as os from 'os';
import * as path from 'node:path';

const cwd = process.cwd();

export function getUserDataPath(productName: string): string {
  const userDataPath = doGetUserDataPath(productName);
  const pathsToResolve = [userDataPath];

  if (!path.isAbsolute(userDataPath)) {
    pathsToResolve.unshift(cwd);
  }

  return path.resolve(...pathsToResolve);
}

function doGetUserDataPath(productName: string): string {
  let appDataPath = process.env['VSCODE_APPDATA'];
  switch (process.platform) {
    case 'win32':
      appDataPath = process.env['APPDATA'];
      if (!appDataPath) {
        const userProfile = process.env['USERPROFILE'];
        if (typeof userProfile !== 'string') {
          throw new Error(
            'Windows: Unexpected undefined %USERPROFILE% environment variable',
          );
        }
        appDataPath = path.join(userProfile, 'AppData', 'Roaming');
      }
      break;
    case 'darwin':
      appDataPath = path.join(os.homedir(), 'Library', 'Application Support');
      break;
    case 'linux':
      appDataPath =
        process.env['XDG_CONFIG_HOME'] || path.join(os.homedir(), '.config');
      break;
    default:
      throw new Error('Platform not supported');
  }

  return path.join(appDataPath, productName);
}
