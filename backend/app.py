# app.py
from flask import Flask, request, jsonify, send_from_directory, render_template_string
import os
import numpy as np
from embedding_utils import encode_images_from_folder, search_images, encode_single_image
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid
import json
import shutil

# Custom JSON encoder to handle numpy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.bool_):
            return bool(obj)
        return super().default(obj)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Use custom JSON encoder for Flask
app.json.encoder = NumpyEncoder

# Configuration
EMBEDDING_FILE = "embeddings/image_embeddings.npy"
IMAGE_FOLDER = "data/"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# Create folders if they don't exist
os.makedirs(IMAGE_FOLDER, exist_ok=True)
os.makedirs("embeddings", exist_ok=True)

# Clean up old embeddings file if it's corrupted
if os.path.exists(EMBEDDING_FILE):
    try:
        data = np.load(EMBEDDING_FILE, allow_pickle=True).item()
        # Verify data integrity - check if paths are strings and embeddings are arrays
        valid_data = True
        if not isinstance(data, dict) or "embeddings" not in data or "paths" not in data:
            valid_data = False
        elif len(data["paths"]) > 0:
            # Check first path to see if it's a string
            if not isinstance(data["paths"][0], str):
                valid_data = False
        
        if not valid_data:
            print("Corrupted embeddings file detected. Removing it...")
            os.remove(EMBEDDING_FILE)
            print("Embeddings file removed. Will regenerate on startup.")
    except Exception as e:
        print(f"Error with embeddings file: {str(e)}. Removing it.")
        os.remove(EMBEDDING_FILE)

# Load or generate embeddings
if os.path.exists(EMBEDDING_FILE):
    data = np.load(EMBEDDING_FILE, allow_pickle=True).item()
    image_embeddings = data["embeddings"] 
    image_paths = data["paths"]
    print(f"Loaded {len(image_paths)} image embeddings")
else:
    print(f"Generating embeddings from {IMAGE_FOLDER}")
    image_paths, image_embeddings = encode_images_from_folder(IMAGE_FOLDER)
    if len(image_paths) > 0:
        np.save(EMBEDDING_FILE, {"embeddings": image_embeddings, "paths": image_paths})
        print(f"Generated embeddings for {len(image_paths)} images")
    else:
        print("No images found to process.")
        image_embeddings = np.array([])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Root route to verify the server is running"""
    image_list = []
    for path in image_paths:
        image_list.append(f"<li>{path}</li>")
    
    image_html = "<ul>" + "".join(image_list) + "</ul>" if image_list else "<p>No images found.</p>"
    
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>CoDress API</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
            code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
            ul { margin-top: 5px; }
            img { max-width: 100px; max-height: 100px; margin: 5px; border: 1px solid #ccc; }
            .images { display: flex; flex-wrap: wrap; }
        </style>
    </head>
    <body>
        <h1>CoDress API Server</h1>
        <p>Server is running. Available endpoints:</p>
        
        <div class="endpoint">
            <h3>GET /api/images</h3>
            <p>List all available images</p>
        </div>
        
        <div class="endpoint">
            <h3>POST /api/search</h3>
            <p>Search for images with text query</p>
            <code>{"query": "red dress"}</code>
        </div>
        
        <div class="endpoint">
            <h3>POST /api/upload</h3>
            <p>Upload a new image</p>
        </div>
        
        <div class="endpoint">
            <h3>GET /data/&lt;filename&gt;</h3>
            <p>Retrieve image file</p>
        </div>
        
        <h3>Current images ({}):</h3>
        {}
        <div class="images">
            {}
        </div>
    </body>
    </html>
    """.format(len(image_paths), image_html, 
              "".join([f'<img src="/data/{path}" alt="{path}" title="{path}">' for path in image_paths]))
    return render_template_string(html)

@app.route("/api/search", methods=["POST"])
def search_api():
    data = request.get_json()
    query = data.get("query", "")
    if not query:
        return jsonify({"error": "query is required"}), 400

    if len(image_paths) == 0 or image_embeddings.size == 0:
        return jsonify([]), 200  # Return empty array if no images

    results = search_images(query, image_embeddings, image_paths)
    
    # Add full URLs to the results
    for result in results:
        result["url"] = f"/data/{result['filename']}"
    
    return jsonify(results)

# Keep the old route for backward compatibility
@app.route("/search", methods=["POST"])
def search():
    return search_api()

@app.route("/api/upload", methods=["POST"])
def upload_file_api():
    global image_embeddings, image_paths
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        # Generate unique filename to avoid overwriting
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        
        filepath = os.path.join(IMAGE_FOLDER, unique_filename)
        file.save(filepath)
        
        # Generate embedding for new image
        try:
            embedding = encode_single_image(filepath)
            
            # Add to existing embeddings
            if image_embeddings.size > 0:
                image_embeddings = np.vstack([image_embeddings, embedding])
            else:
                image_embeddings = embedding.reshape(1, -1)
                
            image_paths.append(unique_filename)
            
            # Save updated embeddings
            np.save(EMBEDDING_FILE, {"embeddings": image_embeddings, "paths": image_paths})
            
            return jsonify({
                "success": True, 
                "filename": unique_filename,
                "url": f"/data/{unique_filename}"
            })
            
        except Exception as e:
            os.remove(filepath)  # Clean up file if embedding fails
            return jsonify({"error": f"Failed to process image: {str(e)}"}), 500
    
    return jsonify({"error": "File type not allowed"}), 400

# Keep the old route for backward compatibility
@app.route("/upload", methods=["POST"])
def upload_file():
    return upload_file_api()

@app.route('/data/<path:filename>')
def serve_image(filename):
    return send_from_directory(os.path.abspath(IMAGE_FOLDER), filename)

@app.route('/api/images', methods=['GET'])
def list_images():
    # Return list of all images with their URLs
    images = []
    try:
        for i, path in enumerate(image_paths):
            images.append({
                "id": int(i),  # Ensure integer type
                "filename": str(path),  # Ensure string type
                "url": f"/data/{path}"
            })
        return jsonify(images)
    except Exception as e:
        print(f"Error in list_images: {str(e)}")
        # Return simple version in case of error
        safe_images = [{"id": i, "filename": str(p), "url": f"/data/{p}"} 
                      for i, p in enumerate(image_paths)]
        return jsonify(safe_images)

@app.route('/api/reset', methods=['POST'])
def reset_embeddings():
    """Reset the embeddings and regenerate them"""
    global image_embeddings, image_paths
    
    if os.path.exists(EMBEDDING_FILE):
        os.remove(EMBEDDING_FILE)
    
    image_paths, image_embeddings = encode_images_from_folder(IMAGE_FOLDER)
    
    if len(image_paths) > 0:
        np.save(EMBEDDING_FILE, {"embeddings": image_embeddings, "paths": image_paths})
    
    return jsonify({
        "success": True,
        "message": f"Reset complete. Processed {len(image_paths)} images."
    })

# Error handler for 404 errors
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found. Please check the API documentation at the root URL."}), 404

if __name__ == "__main__":
    print(f"Server running on http://localhost:5000/")
    app.run(debug=True, host='0.0.0.0', port=5000)
