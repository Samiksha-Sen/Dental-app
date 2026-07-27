import { Platform } from 'react-native';

// Extracted verbatim from the scan flow's fetch-to-/predict call — same
// web-blob vs native-uri branching, same request/response shape.
export async function predictXray(uri, apiUrl, threshold) {
  const formData = new FormData();
  formData.append('threshold', threshold.toString());

  if (Platform.OS === 'web') {
    const blobResponse = await fetch(uri);
    const blob = await blobResponse.blob();
    const fileType = blob.type || 'image/png';
    const extension = fileType.split('/')[1] || 'png';
    const uniqueName = `xray_${Date.now()}.${extension}`;
    formData.append('file', blob, uniqueName);
    console.log('Sending file to API, size:', blob.size, 'name:', uniqueName);
  } else {
    let fileType = 'image/jpeg';
    let extension = 'jpg';
    const match = /\.([a-zA-Z0-9]+)$/.exec(uri);
    if (match) {
      extension = match[1].toLowerCase();
      if (extension === 'png') {
        fileType = 'image/png';
      } else if (extension === 'jpeg' || extension === 'jpg') {
        fileType = 'image/jpeg';
      }
    }
    formData.append('file', {
      uri: uri,
      name: `xray_${Date.now()}.${extension}`,
      type: fileType,
    });
  }

  const response = await fetch(`${apiUrl}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  console.log('API Response:', JSON.stringify(data));
  return data;
}
