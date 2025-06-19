import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function MyDropzone() {
  const [dataURL, setDataURL] = useState(null);
  const [uploadedURL, setUploadedURL] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dropzoneKey, setDropzoneKey] = useState(0); // <-- add a key state

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setDataURL(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept: { "image/*": [] },
      maxFiles: 1,
    });

  const selectedFile = acceptedFiles[0];

  const uploadImage = async () => {
    if (!selectedFile) {
      alert("No file selected!");
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary configuration missing!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("upload_preset", uploadPreset);

    try {
      setIsUploading(true);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");
      setUploadedURL(data.secure_url);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setDataURL(null);
    setUploadedURL(null);
    setDropzoneKey((prev) => prev + 1); // 👈 bump the key to reset dropzone
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md">
        {dataURL ? (
          <div className="relative p-4 bg-white rounded-lg shadow-lg transition-transform duration-300 animate-fade-in">
            <img
              src={dataURL}
              alt="Preview"
              className="rounded-lg w-full object-contain"
            />
            <div className="flex justify-between mt-4">
              {uploadedURL ? (
                <span className="text-green-600 font-semibold">Uploaded!</span>
              ) : (
                <button
                  onClick={uploadImage}
                  disabled={isUploading}
                  className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition ${
                    isUploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              )}
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            key={dropzoneKey} // 👈 this resets the dropzone
            {...getRootProps()}
            className={`border-4 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? "border-blue-500 bg-blue-50 scale-105"
                : "border-gray-400 hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mb-2 text-blue-500 animate-bounce"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {isDragActive ? (
                <p className="font-semibold text-blue-600 animate-pulse">
                  Drop your image here...
                </p>
              ) : (
                <p className="text-center">
                  Drag & drop an image here, or click to select a file
                </p>
              )}
            </div>
          </div>
        )}

        {uploadedURL && (
          <a
            href={uploadedURL}
            target="_blank"
            rel="noreferrer"
            className="block mt-4 text-blue-600 hover:underline break-all text-sm text-center"
          >
            {uploadedURL}
          </a>
        )}
      </div>
    </div>
  );
}
