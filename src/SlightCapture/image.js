import {cuid} from "./guid.js";


export const imageResize = (cv) => (image, max = null) => {
    //# initialize the dimensions of the image to be resized and
    //# grab the image size
    const w = image.rows;
    const h = image.cols;

    // # if both the width and height are None, then return the
    // # original image
    if (!max) {
        return image, 1;
    }

    let new_width = w;
    let new_height = h;
    let ratio = 1;
    if (w > h) {
        if (w > max) {
            ratio = max / w
            new_width = parseInt(w * ratio, 10);
            new_height = parseInt(h * ratio, 10);
        }
    } else {
        if (h > max) {
            ratio = max / h
            new_width = parseInt(w * ratio, 10);
            new_height = parseInt(h * ratio, 10);
        }
    }

    let dsize = new cv.Size(new_height, new_width);
    let resized = new cv.Mat();
    cv.resize(image, resized, dsize, 0, 0, cv.INTER_AREA);

    return {image: resized, ratio};
}

export const rotateImage = (cv) => (img, angleDeg) => {
    const src = img;
    let dst = new cv.Mat();

    if (angleDeg === 90) {
        cv.rotate(src, dst, cv.ROTATE_90_CLOCKWISE);
        return dst;
    } else if (angleDeg === 180) {
        cv.rotate(src, dst, cv.ROTATE_180);
        return dst;
    } else if (angleDeg === 270) {
        cv.rotate(src, dst, cv.ROTATE_90_COUNTERCLOCKWISE);
        return dst;
    } else if (angleDeg === 0) {
        return img;
    }
    const maxSize = Math.max(src.rows, src.cols);
    let dsize = new cv.Size(maxSize, maxSize);
    let height = src.rows;
    let width = src.cols;
    let center = new cv.Point((src.cols) / 2, (src.rows) / 2);
    // You can try more different parameters
    let rotation_mat = cv.getRotationMatrix2D(center, angleDeg, 1);

    // rotation calculates the cos and sin, taking absolutes of those.
    let abs_cos = Math.abs(rotation_mat[0, 0])
    let abs_sin = Math.abs(rotation_mat[0, 1])

    //  # find the new width and height bounds
    let bound_w = parseInt(height * abs_sin + width * abs_cos);
    let bound_h = parseInt(height * abs_cos + width * abs_sin);

    //# subtract old image center (bringing image back to origo) and adding the new image center coordinates
    rotation_mat[0, 2] += bound_w / 2 - ((src.cols) / 2)
    rotation_mat[1, 2] += bound_h / 2 - ((src.rows) / 2)

    cv.warpAffine(src, dst, rotation_mat, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    rotation_mat.delete();
    return dst;
}

export const toImageBase64 = (cv) => (imgCv) => {
    const outputCanvas = document.createElement("canvas");
    outputCanvas.style = 'visibility:hidden;display:none;';
    cv.imshow(outputCanvas, imgCv);
    document.getElementsByTagName('body')[0].appendChild(outputCanvas);
    const url = outputCanvas.toDataURL();
    outputCanvas.remove();
    return url;
}

export const loadImageAsync = (cv) => (url, color =null ) => {
    return new Promise((resolve, error) => {
        const iDiv = document.createElement('div');
        iDiv.style = 'visibility:hidden;display:none;';
        iDiv.id = cuid();
        document.getElementsByTagName('body')[0].appendChild(iDiv);
        const imgElement = document.createElement('img');
        iDiv.appendChild(imgElement);
        imgElement.id = cuid();
        imgElement.src = url;
        imgElement.onload = function () {
            function loadImage() {
                let imgCv = !color ? cv.imread(imgElement) : cv.imread(imgElement, color);
                iDiv.remove();
                resolve(imgCv);
            }

            setTimeout(loadImage, 250);
        };

        imgElement.onerror = function () {
            iDiv.remove();
            error()
        };
    });
}

export const cropImage = (cv) => (img, xmin, ymin, witdh, height) => {
    let rect = new cv.Rect(xmin, ymin, witdh, height);
    return img.roi(rect);
}

