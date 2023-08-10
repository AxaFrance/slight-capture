export function base64ToBlob(base64String) {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
}

export const blobToBase64Async = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});


export const toBlobAsync = (cv) => (imgCv, mimeType ="image/jpeg", quality= 0.6) => {
    return new Promise((resolve) => {

        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = imgCv.cols;
        outputCanvas.height = imgCv.rows;
        outputCanvas.style = 'visibility:hidden;display:none;';
        cv.imshow(outputCanvas, imgCv);
        document.getElementsByTagName('body')[0].appendChild(outputCanvas);

        outputCanvas.toBlob(function (blob) {
            outputCanvas.remove();
            resolve(blob);
        }, mimeType, quality);
    });
}
