const ImageKit = require("imagekit");
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});


const uploadToImageKit = async (file, fileName) => {
    const response = await imagekit.upload({
        file: file,
        fileName: fileName,
        folder: 'apex_connect_avatars'
    })

    return response;
}
module.exports = uploadToImageKit;