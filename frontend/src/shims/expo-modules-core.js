// Shim for expo-modules-core in web builds
export function requireNativeModule() {
  return {};
}

export function requireOptionalNativeModule() {
  return null;
}
