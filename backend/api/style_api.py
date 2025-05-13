from flask import Blueprint, request, jsonify
import os
from pathlib import Path
from ..models.dataset_handler import MMFashionDataset

# Create a Blueprint for style-related routes
style_bp = Blueprint('style', __name__)

# Initialize the dataset
clothing_dataset = MMFashionDataset()

@style_bp.route('/categories')
def categories():
    """Return all clothing categories"""
    return jsonify({"categories": clothing_dataset.get_categories()})

@style_bp.route('/attributes')
def attributes():
    """Return all clothing attributes and their possible values"""
    return jsonify({"attributes": clothing_dataset.get_attributes()})

@style_bp.route('/preferences', methods=['POST'])
def handle_preferences():
    """Process style preferences and return matching items"""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    data = request.get_json()
    style = data.get('style', 'casual')  # Default to casual
    wardrobe_text = data.get('wardrobe', '')
    
    # Get matching items based on style
    matching_items = clothing_dataset.get_matching_items(style)
    
    # Convert to a format frontend can use
    result = []
    for item in matching_items:
        result.append({
            "id": item['id'],
            "category": item['category'],
            "color": item['color'],
            "pattern": item['pattern'],
            "material": item['material'],
            "suggestion": f"This {item['color']} {item['pattern']} {item['category']} would look great with your {style} style!"
        })
    
    return jsonify({
        "message": "Style preferences processed",
        "style": style,
        "wardrobe_items": wardrobe_text.split(',') if wardrobe_text else [],
        "matching_suggestions": result
    })

@style_bp.route('/item/<item_id>')
def get_item(item_id):
    """Return details for a specific item"""
    # In a real implementation, we would fetch the item from the database
    # For now, we'll create a sample item
    item = {
        "id": item_id,
        "category": "shirt",
        "color": "blue",
        "pattern": "solid",
        "material": "cotton",
        "style": "formal",
        "suggestion": "This blue solid shirt would go well with navy pants and brown shoes."
    }
    
    return jsonify({"item": item}) 