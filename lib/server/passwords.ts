import path from "path";

type BcryptLib = {
  hash: (data: string, saltOrRounds: number | string) => Promise<string>;
  compare: (data: string, encrypted: string) => Promise<boolean>;
};

let bcryptLib: BcryptLib | null = null;

function getBcrypt(): BcryptLib {
  if (bcryptLib) return bcryptLib;
  // Use eval('require') so Webpack does not attempt to bundle the native C++ binary and its dev dependencies
  const nodeRequire = eval("require") as (id: string) => BcryptLib;
  const localPath = path.resolve(process.cwd(), "services/auth-service/node_modules/bcrypt");
  bcryptLib = nodeRequire(localPath);
  return bcryptLib;
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = getBcrypt();
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = getBcrypt();
  return bcrypt.compare(password, hash);
}

