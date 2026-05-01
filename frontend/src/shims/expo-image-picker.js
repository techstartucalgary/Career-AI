// Shim for expo-image-picker in web builds
export const MediaTypeOptions = {
  All: 'All',
  Images: 'Images',
  Videos: 'Videos',
};

export async function requestMediaLibraryPermissionsAsync() {
  return { status: 'granted' };
}

export async function launchImageLibraryAsync(options = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            canceled: false,
            assets: [{ uri: reader.result, fileName: file.name, type: file.type }],
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({ canceled: true, assets: [] });
      }
    };
    input.click();
  });
}
