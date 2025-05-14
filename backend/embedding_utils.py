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
    print(f"[embedding_utils.py] generate_text_embedding for: '{text[:100]}...'")
    text_tokens = clip.tokenize([text]).to(device)
    with torch.no_grad():
        text_embedding = model.encode_text(text_tokens)
        text_embedding /= text_embedding.norm(dim=-1, keepdim=True)
    print(f"[embedding_utils.py] Generated text_embedding shape: {text_embedding.shape}")
    return text_embedding.cpu().numpy()

def search_images(text_query, image_embeddings, image_paths, style=None):
    print(f"[embedding_utils.py] search_images called with text_query: '{text_query}', style: '{style}'")
    MIN_SIMILARITY_THRESHOLD = 0.2 
    
    if not image_paths or image_embeddings is None or image_embeddings.size == 0:
        print("[embedding_utils.py] No image_paths or image_embeddings available.")
        return []
    
    # CRUCIAL CHECK: Ensure consistency between embeddings and paths
    if image_embeddings.shape[0] != len(image_paths):
        print(f"[embedding_utils.py] FATAL ERROR: Mismatch between image_embeddings count ({image_embeddings.shape[0]}) and image_paths count ({len(image_paths)}).")
        # This is a critical state. Consider how to handle - perhaps re-generate embeddings or return an error.
        # For now, returning empty to prevent further errors.
        return [] 

    print(f"[embedding_utils.py] Number of image_paths: {len(image_paths)}, image_embeddings shape: {image_embeddings.shape}. Counts match.")

    augmented_query = text_query
    if style:
        if style.lower() == 'formal':
            augmented_query = f"formal style {text_query}" 
        elif style.lower() == 'casual':
            augmented_query = f"casual style {text_query}"
    print(f"[embedding_utils.py] Augmented query: '{augmented_query}'")

    query_parts = re.split(r'\s+(?:and|ve)\s+', augmented_query.lower())
    final_results_to_return = []

    if len(query_parts) > 1:
        print(f"[embedding_utils.py] Compound query detected: {query_parts}")
        all_results_compound = []
        for query_part in query_parts:
            query_part = query_part.strip()
            if not query_part: continue
            print(f"[embedding_utils.py] Processing compound part: '{query_part}'")
            text_embedding = generate_text_embedding(query_part)
            if text_embedding is None or text_embedding.size == 0: 
                print(f"[embedding_utils.py] Failed to generate embedding for query part: '{query_part}'")
                continue
            
            similarities = (image_embeddings @ text_embedding.T).squeeze()
            print(f"[embedding_utils.py] Similarities for '{query_part}' (shape {similarities.shape}): min={np.min(similarities):.4f}, max={np.max(similarities):.4f}, mean={np.mean(similarities):.4f}")

            top_k_compound = min(3, len(image_paths)) # Use len(image_paths) for safety
            best_indices_compound = similarities.argsort()[-top_k_compound:][::-1]
            
            for i in best_indices_compound:
                if i < len(image_paths): # Explicit boundary check
                    similarity = float(similarities[i])
                    if similarity >= MIN_SIMILARITY_THRESHOLD:
                        all_results_compound.append({"filename": image_paths[i], "score": similarity, "query": query_part})
                else:
                    print(f"[embedding_utils.py] WARNING: Stale index {i} for image_paths of length {len(image_paths)} in compound query.")
        
        all_results_compound.sort(key=lambda x: x["score"], reverse=True)
        unique_results_compound = {}
        for result in all_results_compound:
            filename = result["filename"]
            if filename not in unique_results_compound or result["score"] > unique_results_compound[filename]["score"]:
                unique_results_compound[filename] = result
        final_results_to_return = list(unique_results_compound.values())[:2]
    else:
        print(f"[embedding_utils.py] Processing single query: '{augmented_query}'")
        text_embedding = generate_text_embedding(augmented_query)
        if text_embedding is None or text_embedding.size == 0:
            print(f"[embedding_utils.py] Failed to generate embedding for query: '{augmented_query}'")
            return []

        similarities = (image_embeddings @ text_embedding.T).squeeze()
        if similarities.size == 1: 
            similarities = np.array([similarities.item()])
        print(f"[embedding_utils.py] Similarities for '{augmented_query}' (shape {similarities.shape}): min={np.min(similarities):.4f}, max={np.max(similarities):.4f}, mean={np.mean(similarities):.4f}")

        top_k_single = min(2, len(image_paths)) # Use len(image_paths) for safety
        best_indices_single = similarities.argsort()[-top_k_single:][::-1]
        
        for i in best_indices_single:
            if i < len(image_paths): # Explicit boundary check
                similarity = float(similarities[i])
                if similarity >= MIN_SIMILARITY_THRESHOLD:
                    final_results_to_return.append({"filename": image_paths[i], "score": similarity})
            else:
                print(f"[embedding_utils.py] WARNING: Stale index {i} for image_paths of length {len(image_paths)} in single query.")
    
    print(f"[embedding_utils.py] search_images returning: {final_results_to_return}")
    return final_results_to_return
