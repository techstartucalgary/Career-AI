export async function getDocumentAsync(options = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';

    if (options.type) {
      const types = Array.isArray(options.type) ? options.type : [options.type];
      input.accept = types.join(',');
    }

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        resolve({
          canceled: false,
          assets: [{
            name: file.name,
            size: file.size,
            uri: URL.createObjectURL(file),
            mimeType: file.type,
            file,
          }],
        });
      } else {
        resolve({ canceled: true, assets: null });
      }
    };

    input.oncancel = () => {
      resolve({ canceled: true, assets: null });
    };

    input.click();
  });
}
