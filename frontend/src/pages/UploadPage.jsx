import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserPage.css";

export default function UploadPage() {
  const [photos, setPhotos] = useState([]); // Blob önizleme linkleri
  const [files, setFiles] = useState([]); // Gerçek dosyalar
  const navigate = useNavigate();

  const handlePhotoChange = (e) => {
    const selectedFiles = Array.from(e.target.files);NN
    setFiles(selectedFiles); // FormData için dosyalar
    setPhotos(selectedFiles.map((file) => URL.createObjectURL(file))); // Görsel önizleme
  };

  const handleContinue = async () => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Yükleme başarısız");
      }

      const data = await response.json();
      console.log("Upload successful:", data);

      if (data.success && data.allImages) {
        // Navigate to the style page with the new images
        navigate("/style-wardrobe", { 
          state: { 
            timestamp: new Date().getTime(),
            images: data.allImages 
          } 
        });
      } else {
        throw new Error("Upload response missing required data");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Görseller yüklenirken hata oluştu.");
    }
  };

  return (
    <div className="user-page-cream" style={{ minHeight: "100vh" }}>
      <div
        className="chic-section"
        style={{ minHeight: "80vh", justifyContent: "center" }}
      >
        <h1 className="chic-title">Kıyafet Fotoğraflarını Yükle</h1>
        <input
          type="file"
          multiple
          accept="image/*"
          className="chic-upload-input"
          onChange={handlePhotoChange}
        />
        <div className="chic-photo-preview">
          {photos.map((src, i) => (
            <img key={i} src={src} alt="Kıyafet" className="chic-photo" />
          ))}
        </div>
        <button
          className="chic-button"
          style={{ marginTop: "2rem" }}
          onClick={handleContinue}
          disabled={files.length === 0}
        >
          Devam Et
        </button>
      </div>
    </div>
  );
}
