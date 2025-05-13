import os
import torch
import clip
from PIL import Image
import numpy as np
import re

# CLIP modelini yükle
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

def generate_image_embeddings(image_folder):
    image_paths = []
    embeddings = []

    # List all files in the directory
    for filename in os.listdir(image_folder):
        # Filter for image files only
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            image_path = os.path.join(image_folder, filename)
            try:
                # Load and preprocess the image for CLIP
                image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)
                
                # Generate embedding using CLIP
                with torch.no_grad():
                    image_embedding = model.encode_image(image)
                    image_embedding /= image_embedding.norm(dim=-1, keepdim=True)
                
                # Store embedding and filename separately
                embeddings.append(image_embedding.cpu().numpy())
                image_paths.append(filename)  # Just store the filename, not the full path
                print(f"Processed image: {filename}")
            except Exception as e:
                print(f"Error processing {image_path}: {e}")
    
    # Stack all embeddings into a single numpy array if we have any
    if embeddings:
        print(f"Successfully processed {len(embeddings)} images")
        return image_paths, np.vstack(embeddings)
    
    print("No valid images found or processed.")
    return [], np.array([])

# Adding the function that app.py is looking for
def encode_images_from_folder(image_folder):
    """
    Encodes all images in a folder using CLIP model.
    Returns image paths and their embeddings.
    """
    return generate_image_embeddings(image_folder)

def encode_single_image(image_path):
    """
    Encodes a single image file using CLIP model.
    Returns the embedding as a numpy array.
    """
    try:
        image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)
        with torch.no_grad():
            image_embedding = model.encode_image(image)
            image_embedding /= image_embedding.norm(dim=-1, keepdim=True)
        return image_embedding.cpu().numpy().squeeze()
    except Exception as e:
        print(f"Error encoding single image {image_path}: {e}")
        raise

def generate_text_embedding(text):
    text_tokens = clip.tokenize([text]).to(device)
    with torch.no_grad():
        text_embedding = model.encode_text(text_tokens)
        text_embedding /= text_embedding.norm(dim=-1, keepdim=True)
    return text_embedding.cpu().numpy()

def search_images(text_query, image_embeddings, image_paths):
    """
    Search for images matching the text query.
    Handles compound queries with "and" or "ve" (Turkish).
    Args:
        text_query: Text to search for
        image_embeddings: Pre-computed image embeddings
        image_paths: List of image paths corresponding to embeddings
    Returns:
        List of dictionaries with filename and similarity score
    """
    # Set minimum threshold for considering a match relevant
    MIN_SIMILARITY_THRESHOLD = 0.2
    
    # Handle empty case
    if len(image_paths) == 0 or image_embeddings.size == 0:
        return []
    
    # Check if query has multiple parts separated by "and" or "ve" (Turkish)
    query_parts = re.split(r'\s+(?:and|ve)\s+', text_query.lower())
    
    # If we have a compound query
    if len(query_parts) > 1:
        print(f"Compound query detected: {query_parts}")
        all_results = []
        
        # Process each sub-query separately
        for query_part in query_parts:
            query_part = query_part.strip()
            if not query_part:
                continue
                
            text_embedding = generate_text_embedding(query_part)
            similarities = image_embeddings @ text_embedding.T
            similarities = similarities.squeeze()
            
            # Get top 3 results for each query part that meet the threshold
            top_k = min(3, len(image_paths))
            best_indices = similarities.argsort()[-top_k:][::-1]
            
            # Only include results that are sufficiently relevant
            part_results = []
            for i in best_indices:
                similarity = float(similarities[i])
                if similarity >= MIN_SIMILARITY_THRESHOLD:
                    part_results.append({
                        "filename": image_paths[i], 
                        "score": similarity,
                        "query": query_part  # Track which part of the query matched this
                    })
            
            all_results.extend(part_results)
        
        # Sort all results by score (highest first) and remove duplicates
        all_results.sort(key=lambda x: x["score"], reverse=True)
        
        # Remove duplicates but keep the highest score for each filename
        unique_results = {}
        for result in all_results:
            filename = result["filename"]
            if filename not in unique_results or result["score"] > unique_results[filename]["score"]:
                unique_results[filename] = result
        
        # Convert back to list and return top 5
        final_results = list(unique_results.values())
        return final_results[:5]
    
    # Standard single query processing
    else:
        text_embedding = generate_text_embedding(text_query)
        similarities = image_embeddings @ text_embedding.T
        similarities = similarities.squeeze()

        # Get top results
        top_k = min(5, len(image_paths))
        best_indices = similarities.argsort()[-top_k:][::-1]
        
        # Only include relevant results
        results = []
        for i in best_indices:
            similarity = float(similarities[i])
            if similarity >= MIN_SIMILARITY_THRESHOLD:
                results.append({
                    "filename": image_paths[i], 
                    "score": similarity
                })
        
        return results
