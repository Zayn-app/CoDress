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
import traceback

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
IMAGE_FOLDER = os.path.join(os.path.dirname(__file__), 'data')
EMBEDDINGS_FILE = os.path.join(IMAGE_FOLDER, 'image_embeddings.npy')
IMAGE_PATHS_FILE = os.path.join(IMAGE_FOLDER, 'image_paths.json')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# Temporary user store (for demonstration purposes)
# In a real application, use a proper database and password hashing
TEMP_USERS = {
    "testuser": {"password": "password123"}
}

# Create folders if they don't exist
os.makedirs(IMAGE_FOLDER, exist_ok=True)
os.makedirs("embeddings", exist_ok=True)

# Clean up old embeddings file if it's corrupted
if os.path.exists(EMBEDDINGS_FILE):
    try:
        data = np.load(EMBEDDINGS_FILE, allow_pickle=True).item()
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
            os.remove(EMBEDDINGS_FILE)
            print("Embeddings file removed. Will regenerate on startup.")
    except Exception as e:
        print(f"Error with embeddings file: {str(e)}. Removing it.")
        os.remove(EMBEDDINGS_FILE)

# Load or generate embeddings
if os.path.exists(EMBEDDINGS_FILE):
    data = np.load(EMBEDDINGS_FILE, allow_pickle=True).item()
    loaded_image_embeddings = data["embeddings"] 
    loaded_image_paths = data["paths"]
    print(f"[app.py] Initially loaded {len(loaded_image_paths)} paths and {loaded_image_embeddings.shape[0] if hasattr(loaded_image_embeddings, 'shape') else 'N/A'} embeddings from {EMBEDDINGS_FILE}")

    # Filter loaded paths and embeddings to ensure they exist on disk
    image_paths_filtered = []
    image_embeddings_filtered_list = []

    if hasattr(loaded_image_embeddings, 'shape') and loaded_image_embeddings.shape[0] == len(loaded_image_paths):
        for i, path in enumerate(loaded_image_paths):
            full_path = os.path.join(IMAGE_FOLDER, path)
            if os.path.exists(full_path):
                image_paths_filtered.append(path)
                image_embeddings_filtered_list.append(loaded_image_embeddings[i])
            else:
                print(f"[app.py] Stale entry: Image file '{path}' not found at '{full_path}'. Discarding this entry.")
        
        if image_embeddings_filtered_list:
            image_embeddings = np.array(image_embeddings_filtered_list)
            image_paths = image_paths_filtered
            print(f"[app.py] After validation: {len(image_paths)} paths and {image_embeddings.shape[0]} embeddings are valid and synchronized.")
        else:
            print("[app.py] After validation: No valid synchronized embeddings found. Initializing as empty.")
            image_embeddings = np.array([])
            image_paths = []
    else:
        print(f"[app.py] Mismatch between loaded embeddings count ({loaded_image_embeddings.shape[0] if hasattr(loaded_image_embeddings, 'shape') else 'N/A'}) and paths count ({len(loaded_image_paths)}). Or embeddings not an array. Initializing as empty. Consider regenerating embeddings if images exist.")
        image_embeddings = np.array([])
        image_paths = []

else:
    print(f"[app.py] {EMBEDDINGS_FILE} not found. Generating embeddings from {IMAGE_FOLDER}")
    image_paths, image_embeddings = encode_images_from_folder(IMAGE_FOLDER)
    if len(image_paths) > 0:
        np.save(EMBEDDINGS_FILE, {"embeddings": image_embeddings, "paths": image_paths})
        print(f"Generated embeddings for {len(image_paths)} images")
    else:
        print("No images found to process.")
        image_embeddings = np.array([])
        # image_paths is already defined from encode_images_from_folder, ensure it's an empty list if no images
        if not image_paths: # If encode_images_from_folder returned empty paths
            image_paths = []

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/register', methods=['POST'])
def register_api():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # IMPORTANT: Add password validation (length, complexity) in a real app
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    if username in TEMP_USERS:
        return jsonify({"error": "Username already exists"}), 409 # 409 Conflict
    
    # Store the new user (IMPORTANT: Hash password in a real app!)
    TEMP_USERS[username] = {"password": password}
    print(f"New user registered: {username}") # Server log
    
    # Optionally, log the user in directly or send to login page
    return jsonify({
        "success": True, 
        "message": "Registration successful. Please log in.",
        "user": {"username": username}
    })

@app.route('/api/login', methods=['POST'])
def login_api():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Check credentials (IMPORTANT: This is insecure, for demo only!)
    if username in TEMP_USERS and TEMP_USERS[username]["password"] == password:
        # In a real app, generate a session token or JWT here
        return jsonify({
            "success": True, 
            "message": "Login successful",
            "user": {"username": username} # You can add more user details
        })
    else:
        return jsonify({"error": "Invalid username or password"}), 401

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
    style = data.get("style", "")
    print(f"[app.py] /api/search received: query='{query}', style='{style}'")

    if not query:
        print("[app.py] /api/search error: query is required")
        return jsonify({"error": "query is required"}), 400

    if image_embeddings is None or image_embeddings.size == 0 or not image_paths:
        print("[app.py] /api/search error: No images or embeddings loaded.")
        return jsonify([]), 200  # Return empty array if no images/embeddings

    try:
        results = search_images(query, image_embeddings, image_paths, style)
        print(f"[app.py] /api/search results from search_images: {results}")
        
        # Add full URLs to the results (this part should be fine but double-check path generation)
        for result in results:
            result["url"] = f"/data/{result['filename']}"
        
        print(f"[app.py] /api/search returning with URLs: {results}")
        return jsonify(results)
    except Exception as e:
        print(f"[app.py] /api/search EXCEPTION during search_images call or processing: {str(e)}")
        # Consider logging the full traceback for debugging
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An error occurred during search processing.", "details": str(e)}), 500

# Keep the old route for backward compatibility
@app.route("/search", methods=["POST"])
def search():
    return search_api()

@app.route("/api/upload", methods=["POST"])
def upload_file_api():
    global image_embeddings, image_paths
    
    if 'images' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    files = request.files.getlist('images')
    if not files or files[0].filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    uploaded_files = []
    for file in files:
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
                uploaded_files.append({
                    "filename": unique_filename,
                    "url": f"/data/{unique_filename}"
                })
                print(f"Successfully processed and embedded image: {unique_filename}")
                
            except Exception as e:
                os.remove(filepath)  # Clean up file if embedding fails
                print(f"Failed to process image {filename}: {str(e)}")
                continue
    
    if uploaded_files:
        # Save updated embeddings
        np.save(EMBEDDINGS_FILE, {"embeddings": image_embeddings, "paths": image_paths})
        print(f"Saved updated embeddings for {len(image_paths)} images")
        
        # Return the complete updated list of images
        images = []
        for i, path in enumerate(image_paths):
            images.append({
                "id": i,
                "filename": path,
                "url": f"/data/{path}"
            })
        
        return jsonify({
            "success": True,
            "uploaded": uploaded_files,
            "allImages": images
        })
    
    return jsonify({"error": "No files were successfully processed"}), 400

# Keep the old route for backward compatibility
@app.route("/upload", methods=["POST"])
def upload_file():
    return upload_file_api()

@app.route('/data/<path:filename>')
def serve_image(filename):
    response = send_from_directory(os.path.abspath(IMAGE_FOLDER), filename)
    # Add cache control headers to prevent caching
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/api/images', methods=['GET'])
def list_images():
    # Return list of all images with their URLs
    images = []
    try:
        # Get fresh list of files from the directory
        current_files = set(os.listdir(IMAGE_FOLDER))
        # Update image_paths to match current files
        global image_paths
        image_paths = [f for f in image_paths if f in current_files]
        
        for i, path in enumerate(image_paths):
            images.append({
                "id": int(i),
                "filename": str(path),
                "url": f"/data/{path}"
            })
        
        response = jsonify(images)
        # Add cache control headers
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    except Exception as e:
        print(f"Error in list_images: {str(e)}")
        # Return simple version in case of error
        safe_images = [{"id": i, "filename": str(p), "url": f"/data/{p}"} 
                      for i, p in enumerate(image_paths)]
        response = jsonify(safe_images)
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

@app.route('/api/reset', methods=['POST'])
def reset_embeddings():
    """Reset the embeddings and regenerate them"""
    global image_embeddings, image_paths
    
    if os.path.exists(EMBEDDINGS_FILE):
        os.remove(EMBEDDINGS_FILE)
    
    image_paths, image_embeddings = encode_images_from_folder(IMAGE_FOLDER)
    
    if len(image_paths) > 0:
        np.save(EMBEDDINGS_FILE, {"embeddings": image_embeddings, "paths": image_paths})
    
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
