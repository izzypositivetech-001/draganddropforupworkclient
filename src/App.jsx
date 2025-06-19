import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function MyDropzone() {
  const [fileInfo, setFileInfo] = useState({
    dataURL: null,
    uploadedURL: null,
    fileName: null,
    fileType: null,
    fileSize: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFileInfo({
        dataURL: reader.result,
        uploadedURL: null,
        fileName: file.name,
        fileType: file.type || "Unknown",
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB"
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept: "*/*", // Accept all file types
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
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");
      
      setFileInfo(prev => ({
        ...prev,
        uploadedURL: data.secure_url
      }));
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFileInfo({
      dataURL: null,
      uploadedURL: null,
      fileName: null,
      fileType: null,
      fileSize: null
    });
    setDropzoneKey((prev) => prev + 1);
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return "📄";
    
    const type = fileType.split('/')[0];
    switch(type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      case 'audio':
        return '🎵';
      case 'application':
        if (fileType.includes('pdf')) return '📕';
        if (fileType.includes('zip') || fileType.includes('compressed')) return '🗄️';
        if (fileType.includes('msword') || fileType.includes('wordprocessingml')) return '📝';
        if (fileType.includes('spreadsheetml') || fileType.includes('excel')) return '📊';
        return '📄';
      case 'text':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md">
        {fileInfo.dataURL ? (
          <div className="relative p-4 bg-white rounded-lg shadow-lg transition-transform duration-300 animate-fade-in">
            <div className="flex flex-col items-center mb-4">
              <span className="text-4xl mb-2">{getFileIcon(fileInfo.fileType)}</span>
              <h3 className="font-semibold text-lg truncate max-w-full">{fileInfo.fileName}</h3>
              <p className="text-gray-600 text-sm">{fileInfo.fileType} • {fileInfo.fileSize}</p>
            </div>

            {/* Show preview for images */}
            {fileInfo.fileType.startsWith('image/') && (
              <img
                src={fileInfo.dataURL}
                alt="Preview"
                className="rounded-lg w-full object-contain max-h-64 mb-4"
              />
            )}

            <div className="flex justify-between mt-4">
              {fileInfo.uploadedURL ? (
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
            key={dropzoneKey}
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
                  Drop your file here...
                </p>
              ) : (
                <p className="text-center">
                  Drag & drop any file here, or click to select a file
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">Supports all file types</p>
            </div>
          </div>
        )}

        {fileInfo.uploadedURL && (
          <div className="mt-4 text-center">
            <a
              href={fileInfo.uploadedURL}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline break-all text-sm"
            >
              {fileInfo.uploadedURL}
            </a>
            <p className="text-xs text-gray-500 mt-1">Click to view/download</p>
          </div>
        )}
      </div>
    </div>
  );
}